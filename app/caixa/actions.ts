'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getSalesData() {
  const supabase = createAdminClient()

  const { data: sales, error } = await supabase
    .from('canteen_sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Erro ao buscar vendas:', error)
    return []
  }

  return sales ?? []
}
