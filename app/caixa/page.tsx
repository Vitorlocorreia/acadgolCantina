import { TrendingUp } from 'lucide-react'
import { getSalesData } from './actions'
import { CaixaClient } from './caixa-client'

export const dynamic = 'force-dynamic'

export default async function CaixaPage() {
  const sales = await getSalesData()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bebas text-3xl sm:text-4xl tracking-wider leading-none flex items-center gap-2.5 text-[var(--text-primary)]">
            <TrendingUp className="w-8 h-8 text-[#1A6B2E] dark:text-emerald-400" />
            Caixa & Fechamento de Vendas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Faturamento diário, divisão por método de pagamento (PIX, Cartão, Carteira) e histórico de cupons.
          </p>
        </div>
      </div>

      <CaixaClient sales={sales} />
    </div>
  )
}
