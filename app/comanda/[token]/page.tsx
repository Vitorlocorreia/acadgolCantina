import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ComandaPublicClient } from './comanda-public-client'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ComandaPublicaPage({ params }: PageProps) {
  const { token } = await params

  if (!token) {
    notFound()
  }

  const supabase = createAdminClient()

  const { data: tab, error } = await supabase
    .from('canteen_tabs')
    .select('*, items:canteen_tab_items(*), payments:canteen_tab_payments(*)')
    .eq('share_token', token)
    .single()

  if (error || !tab) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-950 border border-red-800 text-red-400 flex items-center justify-center text-2xl font-bold mb-4">
          ✕
        </div>
        <h1 className="font-bebas text-3xl tracking-wider mb-2">Comanda Não Encontrada</h1>
        <p className="text-zinc-400 text-sm max-w-sm">
          Este link pode ter expirado ou o QR Code escaneado não é mais válido. Peça ao garçom para verificar o número da sua comanda.
        </p>
      </div>
    )
  }

  return <ComandaPublicClient tab={tab} />
}
