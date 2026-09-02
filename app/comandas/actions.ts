'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getTabsList() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('canteen_tabs')
    .select('*, items:canteen_tab_items(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar comandas:', error)
    return []
  }

  return data ?? []
}

export async function removeTabItemAction(itemId: string, tabId: string) {
  const supabase = createAdminClient()

  await supabase.from('canteen_tab_items').delete().eq('id', itemId)

  // Recalcula total
  const { data: allItems } = await supabase
    .from('canteen_tab_items')
    .select('total_price')
    .eq('tab_id', tabId)

  const newTotal = (allItems || []).reduce((acc, i) => acc + Number(i.total_price), 0)

  await supabase
    .from('canteen_tabs')
    .update({ total_amount: newTotal })
    .eq('id', tabId)

  revalidatePath('/comandas')
  revalidatePath('/')
  return { success: true }
}
