'use server'

import { createAdminClient } from '@/lib/supabase/admin'

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
      guardian:guardians(name, phone)
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
