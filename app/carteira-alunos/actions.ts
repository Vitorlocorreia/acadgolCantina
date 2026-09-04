'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getStudentsWalletsList() {
  const supabase = createAdminClient()

  const { data: students, error } = await supabase
    .from('students')
    .select(`
      id,
      name,
      uniform_size,
      status,
      preferred_position,
      wallet:student_wallets(*),
      guardian:guardians(name, phone),
      medical:medical_records(allergies, medical_notes)
    `)
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) {
    console.error('Erro ao buscar carteiras:', error)
    return { students: [], transactions: [] }
  }

  // Busca transações recentes
  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*, student:students(name)')
    .order('created_at', { ascending: false })
    .limit(30)

  return {
    students: students ?? [],
    transactions: transactions ?? [],
  }
}

export async function updateDailyLimitAction(studentId: string, dailyLimit: number | null) {
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
