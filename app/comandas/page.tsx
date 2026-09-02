import { ClipboardList } from 'lucide-react'
import { getTabsList } from './actions'
import { ComandasClient } from './comandas-client'

export default async function ComandasPage() {
  const tabs = await getTabsList()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bebas text-3xl sm:text-4xl tracking-wider leading-none flex items-center gap-2.5 text-[var(--text-primary)]">
            <ClipboardList className="w-8 h-8 text-[#1A6B2E] dark:text-emerald-400" />
            Comandas da Pelada & Quadras
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de consumo dos grupos de futebol, cálculo de divisão por jogador e fechamento de conta.
          </p>
        </div>
      </div>

      <ComandasClient tabs={tabs} />
    </div>
  )
}
