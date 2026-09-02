'use client'

import { useState, useTransition } from 'react'
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Search,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { updateProductStockAction } from '../actions'

interface Props {
  products: any[]
}

function fmt(val: number) {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ProdutosClient({ products }: Props) {
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState<any[]>(products)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const handleStockChange = (productId: string, currentStock: number, delta: number) => {
    const next = Math.max(0, currentStock + delta)
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, current_stock: next } : item))
    )

    startTransition(async () => {
      await updateProductStockAction(productId, next)
    })
  }

  const filteredItems = items.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const lowStockCount = items.filter((i) => i.current_stock <= i.min_stock).length
  const totalStockUnits = items.reduce((acc, i) => acc + (i.current_stock || 0), 0)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">Total em Estoque</span>
          <div className="font-bebas text-3xl text-[var(--text-primary)] leading-none">
            {totalStockUnits} <span className="text-sm font-sans text-slate-400">unidades</span>
          </div>
          <p className="text-[10px] text-[#1A6B2E] font-medium">Bebidas, lanches e snacks</p>
        </div>

        <div className={`card-app p-4 space-y-1 ${
          lowStockCount > 0 ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20' : ''
        }`}>
          <span className="text-xs font-bold uppercase text-slate-500">Alerta de Reposição</span>
          <div className="font-bebas text-3xl text-amber-600 dark:text-amber-400 leading-none">
            {lowStockCount}
          </div>
          <p className="text-[10px] text-slate-400">Itens com estoque baixo</p>
        </div>

        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">Produtos Cadastrados</span>
          <div className="font-bebas text-3xl text-[var(--text-primary)] leading-none">
            {items.length}
          </div>
          <p className="text-[10px] text-slate-400">Itens no cardápio</p>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="card-app overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#1A6B2E] dark:text-emerald-400" />
            <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
              Cardápio & Estoque da Cantina
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-app text-xs py-1.5 cursor-pointer w-40"
            >
              <option value="all">Todas Categorias</option>
              <option value="cervejas">🍺 Cervejas & Chopp</option>
              <option value="sem_alcool">🥤 Sem Álcool</option>
              <option value="lanches">🍢 Lanches & Espetinhos</option>
              <option value="snacks_acai">🍧 Snacks & Açaí</option>
            </select>

            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-app pl-8 text-xs py-1.5"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-color)] text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Custo</th>
                <th className="px-5 py-3">Venda</th>
                <th className="px-5 py-3">Margem</th>
                <th className="px-5 py-3 text-center">Estoque Atual</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredItems.map((prod) => {
                const isOut = prod.current_stock <= 0
                const isLow = prod.current_stock <= prod.min_stock
                const margin = prod.sale_price - prod.cost_price
                const marginPct = prod.cost_price > 0 ? (margin / prod.cost_price) * 100 : 100

                return (
                  <tr key={prod.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span className="text-xl">{prod.image_emoji || '🍺'}</span>
                      <span>{prod.name}</span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 capitalize">
                      {prod.category.replace('_', ' ')}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {fmt(prod.cost_price)}
                    </td>

                    <td className="px-5 py-3.5 font-mono font-bold text-[#1A6B2E] dark:text-emerald-400">
                      {fmt(prod.sale_price)}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      +{marginPct.toFixed(0)}% ({fmt(margin)})
                    </td>

                    <td className="px-5 py-3.5 text-center font-mono font-bold text-base text-[var(--text-primary)]">
                      {prod.current_stock}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isOut
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
                            : isLow
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-[#C8E6C9] text-[#0D4A1C] border-[#1A6B2E]/20 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {isOut ? 'Esgotado' : isLow ? 'Baixo' : 'OK'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStockChange(prod.id, prod.current_stock, -1)}
                          disabled={prod.current_stock <= 0 || isPending}
                          className="w-7 h-7 rounded bg-[var(--bg-subtle)] hover:bg-red-50 hover:text-red-600 border border-[var(--border-color)] flex items-center justify-center font-bold transition-all disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleStockChange(prod.id, prod.current_stock, 1)}
                          disabled={isPending}
                          className="w-7 h-7 rounded bg-[var(--bg-subtle)] hover:bg-[#C8E6C9] hover:text-[#0D4A1C] border border-[var(--border-color)] flex items-center justify-center font-bold transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
