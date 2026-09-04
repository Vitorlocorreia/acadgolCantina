'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// 1. Busca todos os dados necessários para o PDV
export async function getCanteenData() {
  const supabase = createAdminClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [productsRes, tabsRes, studentsRes, salesRes, todayPurchasesRes] = await Promise.all([
    supabase
      .from('canteen_products')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('canteen_tabs')
      .select('*, items:canteen_tab_items(*), payments:canteen_tab_payments(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false }),
    supabase
      .from('students')
      .select('id, name, uniform_size, status, wallet:student_wallets(*), guardian:guardians(name, phone), medical:medical_records(allergies, medical_notes)')
      .eq('status', 'active')
      .order('name', { ascending: true }),
    supabase
      .from('canteen_sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('wallet_transactions')
      .select('student_id, amount')
      .eq('type', 'purchase')
      .gte('created_at', todayStart.toISOString()),
  ])

  // Calcula quanto cada aluno já consumiu hoje
  const todaySpentByStudent: Record<string, number> = {}
  for (const tx of todayPurchasesRes.data || []) {
    if (tx.student_id) {
      todaySpentByStudent[tx.student_id] = (todaySpentByStudent[tx.student_id] || 0) + Number(tx.amount || 0)
    }
  }

  const enrichedStudents = (studentsRes.data || []).map((st: any) => ({
    ...st,
    spentToday: todaySpentByStudent[st.id] || 0,
  }))

  return {
    products: productsRes.data ?? [],
    openTabs: tabsRes.data ?? [],
    students: enrichedStudents,
    recentSales: salesRes.data ?? [],
  }
}

// 2. Venda Direta no Balcão (1-Toque)
export async function processDirectSaleAction(
  items: { productId: string; name: string; quantity: number; unitPrice: number }[],
  paymentMethod: string,
  clientName: string = 'Cliente Balcão'
) {
  const supabase = createAdminClient()
  const totalAmount = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)
  const itemsSummary = items.map((i) => `${i.quantity}x ${i.name}`).join(', ')

  // Grava a venda
  const { error: saleError } = await supabase.from('canteen_sales').insert({
    client_name: clientName,
    total_amount: totalAmount,
    payment_method: paymentMethod,
    items_summary: itemsSummary,
  })

  if (saleError) {
    return { success: false, error: saleError.message }
  }

  // Abate estoque
  for (const item of items) {
    const { data: prod } = await supabase
      .from('canteen_products')
      .select('current_stock')
      .eq('id', item.productId)
      .single()

    if (prod) {
      await supabase
        .from('canteen_products')
        .update({ current_stock: Math.max(0, prod.current_stock - item.quantity) })
        .eq('id', item.productId)
    }
  }

  revalidatePath('/')
  revalidatePath('/produtos')
  revalidatePath('/caixa')
  return { success: true }
}

// 3. Lançar Itens na Comanda da Pelada
export async function addToTabAction(
  tabId: string,
  items: { productId: string; name: string; quantity: number; unitPrice: number }[]
) {
  const supabase = createAdminClient()

  for (const item of items) {
    await supabase.from('canteen_tab_items').insert({
      tab_id: tabId,
      product_id: item.productId,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
    })

    // Abate estoque
    const { data: prod } = await supabase
      .from('canteen_products')
      .select('current_stock')
      .eq('id', item.productId)
      .single()

    if (prod) {
      await supabase
        .from('canteen_products')
        .update({ current_stock: Math.max(0, prod.current_stock - item.quantity) })
        .eq('id', item.productId)
    }
  }

  // Recalcula total da comanda
  const { data: allItems } = await supabase
    .from('canteen_tab_items')
    .select('total_price')
    .eq('tab_id', tabId)

  const newTotal = (allItems || []).reduce((acc, i) => acc + Number(i.total_price), 0)

  await supabase
    .from('canteen_tabs')
    .update({ total_amount: newTotal })
    .eq('id', tabId)

  revalidatePath('/')
  revalidatePath('/comandas')
  revalidatePath('/produtos')
  return { success: true }
}

// 4. Criar Nova Comanda da Pelada / Aluno
export async function createTabAction(
  clientName: string,
  tabType: string = 'pelada',
  courtOrClass: string = 'Campo 01',
  studentId: string | null = null
) {
  const supabase = createAdminClient()

  const { data: lastTab } = await supabase
    .from('canteen_tabs')
    .select('tab_number')
    .order('tab_number', { ascending: false })
    .limit(1)
    .single()

  const nextNumber = (lastTab?.tab_number || 0) + 1

  const { data: tab, error } = await supabase
    .from('canteen_tabs')
    .insert({
      tab_number: nextNumber,
      client_name: clientName,
      tab_type: tabType,
      court_or_class: courtOrClass,
      student_id: studentId,
      status: 'open',
      total_amount: 0,
    })
    .select('*')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/comandas')
  return { success: true, tab }
}

// 5. Fechar Comanda (Total ou Saldo Restante)
export async function closeTabAction(tabId: string, paymentMethod: string) {
  const supabase = createAdminClient()

  const { data: tab } = await supabase
    .from('canteen_tabs')
    .select('*, items:canteen_tab_items(*), payments:canteen_tab_payments(*)')
    .eq('id', tabId)
    .single()

  if (!tab) {
    return { success: false, error: 'Comanda não encontrada.' }
  }

  const alreadyPaid = Number(tab.paid_amount || 0)
  const remaining = Math.max(0, Number(tab.total_amount) - alreadyPaid)

  // Se houver saldo restante a pagar, registra pagamento final
  if (remaining > 0) {
    await supabase.from('canteen_tab_payments').insert({
      tab_id: tabId,
      amount: remaining,
      payment_method: paymentMethod,
    })

    const itemsSummary = (tab.items || []).map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ')
    await supabase.from('canteen_sales').insert({
      tab_id: tabId,
      client_name: `Comanda #${tab.tab_number} - ${tab.client_name}`,
      total_amount: remaining,
      payment_method: paymentMethod,
      items_summary: itemsSummary || 'Quitação final da comanda',
    })
  }

  // Atualiza comanda para fechada com paid_amount = total_amount
  await supabase
    .from('canteen_tabs')
    .update({
      status: 'closed',
      paid_amount: tab.total_amount,
      closed_at: new Date().toISOString(),
    })
    .eq('id', tabId)

  revalidatePath('/')
  revalidatePath('/comandas')
  revalidatePath('/caixa')
  return { success: true }
}

// 6. Debitar Saldo da Carteira do Aluno da Escolinha (com Trava de Limite Diário)
export async function chargeStudentWalletAction(
  studentId: string,
  items: { productId: string; name: string; quantity: number; unitPrice: number }[],
  totalAmount: number
) {
  const supabase = createAdminClient()

  // Busca ou cria carteira do aluno
  let { data: wallet } = await supabase
    .from('student_wallets')
    .select('*')
    .eq('student_id', studentId)
    .single()

  if (!wallet) {
    const { data: newWallet } = await supabase
      .from('student_wallets')
      .insert({ student_id: studentId, balance: 0 })
      .select('*')
      .single()
    wallet = newWallet
  }

  // TRAVA DE LIMITE DIÁRIO
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { data: todayPurchases } = await supabase
    .from('wallet_transactions')
    .select('amount')
    .eq('student_id', studentId)
    .eq('type', 'purchase')
    .gte('created_at', todayStart.toISOString())

  const spentToday = (todayPurchases || []).reduce((acc, t) => acc + Number(t.amount || 0), 0)
  const dailyLimitNum = wallet.daily_limit ? Number(wallet.daily_limit) : null

  if (dailyLimitNum && dailyLimitNum > 0) {
    if (spentToday + totalAmount > dailyLimitNum) {
      const remainingToday = Math.max(0, dailyLimitNum - spentToday)
      return {
        success: false,
        error: `⚠️ Limite Diário Excedido! O atleta já consumiu R$ ${spentToday.toFixed(2).replace('.', ',')} hoje. Limite configurado pelos pais: R$ ${dailyLimitNum.toFixed(2).replace('.', ',')} (Disponível hoje: R$ ${remainingToday.toFixed(2).replace('.', ',')}).`,
      }
    }
  }

  const currentBalance = Number(wallet?.balance || 0)
  if (currentBalance < totalAmount) {
    return {
      success: false,
      error: `Saldo insuficiente! Saldo atual do aluno: R$ ${currentBalance.toFixed(2).replace('.', ',')}. Valor do lanche: R$ ${totalAmount.toFixed(2).replace('.', ',')}.`,
    }
  }

  const nextBalance = currentBalance - totalAmount
  await supabase
    .from('student_wallets')
    .update({ balance: nextBalance, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)

  const itemsSummary = items.map((i) => `${i.quantity}x ${i.name}`).join(', ')

  // Registra transação
  await supabase.from('wallet_transactions').insert({
    student_id: studentId,
    type: 'purchase',
    amount: totalAmount,
    description: `Consumo Cantina: ${itemsSummary}`,
  })

  // Registra venda no Caixa e busca responsável para notificação
  const { data: student } = await supabase
    .from('students')
    .select('name, guardian:guardians(name, phone)')
    .eq('id', studentId)
    .single()

  await supabase.from('canteen_sales').insert({
    client_name: `Aluno: ${student?.name || 'Escolinha'}`,
    total_amount: totalAmount,
    payment_method: 'prepaid_wallet',
    items_summary: itemsSummary,
  })

  // Disparo automático do extrato de lanche no WhatsApp do pai
  const guardian = Array.isArray(student?.guardian) ? student?.guardian[0] : student?.guardian
  if (guardian?.phone) {
    const { sendEvolutionWhatsApp } = await import('@/lib/whatsapp/evolution')
    const msg = `🥪 *Cantina Academia do Gol — Extrato de Lanche*\n\nOlá ${guardian.name || 'Responsável'}! O atleta *${student?.name}* acabou de lanchar:\n\n• ${itemsSummary}\n*Total debitado:* R$ ${totalAmount.toFixed(2).replace('.', ',')}\n*Saldo restante:* R$ ${nextBalance.toFixed(2).replace('.', ',')}\n\n_Comprovante digital emitido pela Cantina do Gol_`
    await sendEvolutionWhatsApp({ phone: guardian.phone, message: msg }).catch(() => {})
  }

  // Abate estoque
  for (const item of items) {
    const { data: prod } = await supabase
      .from('canteen_products')
      .select('current_stock')
      .eq('id', item.productId)
      .single()

    if (prod) {
      await supabase
        .from('canteen_products')
        .update({ current_stock: Math.max(0, prod.current_stock - item.quantity) })
        .eq('id', item.productId)
    }
  }

  revalidatePath('/')
  revalidatePath('/carteira-alunos')
  revalidatePath('/caixa')
  revalidatePath('/produtos')
  return {
    success: true,
    previousBalance: currentBalance,
    remainingBalance: nextBalance,
    studentName: student?.name,
    guardianPhone: guardian?.phone,
  }
}

// 7. Recarregar Saldo do Aluno (Feito pelo Pai no PIX ou na Secretaria)
export async function depositStudentWalletAction(
  studentId: string,
  amount: number,
  paymentMethod: string = 'pix'
) {
  const supabase = createAdminClient()

  let { data: wallet } = await supabase
    .from('student_wallets')
    .select('*')
    .eq('student_id', studentId)
    .single()

  if (!wallet) {
    const { data: newWallet } = await supabase
      .from('student_wallets')
      .insert({ student_id: studentId, balance: 0 })
      .select('*')
      .single()
    wallet = newWallet
  }

  const newBalance = Number(wallet?.balance || 0) + Number(amount)

  await supabase
    .from('student_wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)

  await supabase.from('wallet_transactions').insert({
    student_id: studentId,
    type: 'deposit',
    amount: amount,
    description: `Recarga de Saldo via ${paymentMethod.toUpperCase()}`,
  })

  revalidatePath('/carteira-alunos')
  return { success: true, newBalance }
}

// 8. Atualizar Estoque de Produto
export async function updateProductStockAction(productId: string, newStock: number) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('canteen_products')
    .update({ current_stock: Math.max(0, newStock) })
    .eq('id', productId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/produtos')
  revalidatePath('/')
  return { success: true }
}

// 9. Cadastrar Novo Produto
export async function createProductAction(formData: FormData) {
  const supabase = createAdminClient()

  const newProduct = {
    name: String(formData.get('name')),
    category: String(formData.get('category') || 'sem_alcool'),
    cost_price: parseFloat(String(formData.get('cost_price') || '0')),
    sale_price: parseFloat(String(formData.get('sale_price') || '0')),
    current_stock: parseInt(String(formData.get('current_stock') || '0')),
    min_stock: parseInt(String(formData.get('min_stock') || '10')),
    image_emoji: String(formData.get('image_emoji') || '🍺'),
    is_active: true,
  }

  const { error } = await supabase.from('canteen_products').insert(newProduct)

  if (error) {
    throw new Error('Erro ao cadastrar produto: ' + error.message)
  }

  revalidatePath('/produtos')
  revalidatePath('/')
}

// 10. Pagamento Parcial / Múltiplo de Comanda
export async function payTabPartialAction(
  tabId: string,
  amount: number,
  paymentMethod: string,
  payerName?: string
) {
  const supabase = createAdminClient()

  const { data: tab } = await supabase
    .from('canteen_tabs')
    .select('*')
    .eq('id', tabId)
    .single()

  if (!tab) {
    return { success: false, error: 'Comanda não encontrada.' }
  }

  const currentPaid = Number(tab.paid_amount || 0)
  const remaining = Number(tab.total_amount) - currentPaid

  if (amount <= 0 || amount > remaining) {
    return {
      success: false,
      error: `Valor inválido! Restam R$ ${remaining.toFixed(2).replace('.', ',')} a pagar.`,
    }
  }

  // Registra pagamento parcial
  const { error: payErr } = await supabase.from('canteen_tab_payments').insert({
    tab_id: tabId,
    amount: amount,
    payment_method: paymentMethod,
  })

  if (payErr) {
    return { success: false, error: payErr.message }
  }

  // Registra no Caixa
  await supabase.from('canteen_sales').insert({
    tab_id: tabId,
    client_name: `Comanda #${tab.tab_number} - ${payerName || tab.client_name} (Parcial)`,
    total_amount: amount,
    payment_method: paymentMethod,
    items_summary: `Pagamento Parcial via ${paymentMethod.toUpperCase()} da Comanda #${tab.tab_number}`,
  })

  const newPaid = currentPaid + amount
  const isFullyPaid = newPaid >= Number(tab.total_amount)

  await supabase
    .from('canteen_tabs')
    .update({
      paid_amount: newPaid,
      status: isFullyPaid ? 'closed' : 'open',
      closed_at: isFullyPaid ? new Date().toISOString() : null,
    })
    .eq('id', tabId)

  revalidatePath('/')
  revalidatePath('/comandas')
  revalidatePath('/caixa')
  return {
    success: true,
    isFullyPaid,
    remaining: Math.max(0, Number(tab.total_amount) - newPaid),
  }
}

// 11. Atualizar Limite Diário do Aluno (Configurado pelos Pais)
export async function updateStudentDailyLimitAction(
  studentId: string,
  dailyLimit: number | null
) {
  const supabase = createAdminClient()

  let { data: wallet } = await supabase
    .from('student_wallets')
    .select('id')
    .eq('student_id', studentId)
    .single()

  if (!wallet) {
    await supabase.from('student_wallets').insert({
      student_id: studentId,
      balance: 0,
      daily_limit: dailyLimit,
    })
  } else {
    await supabase
      .from('student_wallets')
      .update({
        daily_limit: dailyLimit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)
  }

  revalidatePath('/carteira-alunos')
  revalidatePath('/')
  return { success: true }
}

// 12. Disparo de Cupom Térmico Digital via WhatsApp
export async function sendReceiptWhatsAppAction(phone: string, receiptText: string) {
  const { sendEvolutionWhatsApp } = await import('@/lib/whatsapp/evolution')
  return await sendEvolutionWhatsApp({ phone, message: receiptText })
}

