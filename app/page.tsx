import { ShoppingCart } from 'lucide-react'
import { getCanteenData } from './actions'
import { PdvClient } from './pdv-client'

export const dynamic = 'force-dynamic'

export default async function PdvPage() {
  const { products, openTabs, students } = await getCanteenData()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header com Título e Indicadores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bebas text-3xl sm:text-4xl tracking-wider leading-none flex items-center gap-2.5 text-[var(--text-primary)]">
            <ShoppingCart className="w-8 h-8 text-[#1A6B2E] dark:text-emerald-400" />
            PDV Express — Cantina & Bar Academia do Gol
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Lançamento rápido para balcão, comandas da pelada de beira de quadra e carteira de alunos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="card-app px-3.5 py-1.5 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-500">Comandas da Pelada:</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {openTabs.length} abertas
            </span>
          </div>
        </div>
      </div>

      <PdvClient products={products} openTabs={openTabs} students={students} />
    </div>
  )
}
