'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getAllProducts() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('canteen_products')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Erro ao buscar produtos:', error)
    return []
  }

  return data ?? []
}
