'use client'

import { useState, useTransition } from 'react'
import {
  ClipboardList,
  Plus,
  Users,
  CheckCircle2,
  QrCode,
  CreditCard,
  Banknote,
  Trash2,
  Loader2,
  Calendar,
  DollarSign,
  Beer,
} from 'lucide-react'
import { closeTabAction } from '../actions'
import { removeTabItemAction } from './actions'

interface Props {
  tabs: any[]
}

function fmt(val: number) {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ComandasClient({ tabs }: Props) {
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open')
  const [selectedCloseTab, setSelectedCloseTab] = useState<any | null>(null)
  const [splitPlayers, setSplitPlayers] = useState<{ [tabId: string]: number }>({})
  const [feedback, setFeedback] = useState<string | null>(null)

  const filteredTabs = tabs.filter((t) => (filter === 'all' ? true : t.status === filter))

  const handleCloseTab = (paymentMethod: string) => {
    if (!selectedCloseTab) return
    startTransition(async () => {
      const res = await closeTabAction(selectedCloseTab.id, paymentMethod)
      if (res.success) {
        setFeedback(`Comanda #${selectedCloseTab.tab_number} fechada e paga com sucesso via ${paymentMethod.toUpperCase()}!`)
        setSelectedCloseTab(null)
      }
    })
  }

  const handleRemoveItem = (itemId: string, tabId: string) => {
    startTransition(async () => {
      await removeTabItemAction(itemId, tabId)
    })
  }

  const openTabsCount = tabs.filter((t) => t.status === 'open').length
  const totalOpenAmount = tabs
    .filter((t) => t.status === 'open')
    .reduce((acc, t) => acc + Number(t.total_amount || 0), 0)

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3.5 rounded bg-[#C8E6C9]/60 border border-[#1A6B2E]/30 text-[#0D4A1C] text-xs font-bold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1A6B2E]" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards de Comandas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">Comandas da Pelada Abertas</span>
          <div className="font-bebas text-3xl text-amber-500 leading-none">
            {openTabsCount}
          </div>
          <p className="text-[10px] text-slate-400">Em consumo nas quadras</p>
        </div>

        <div className="card-app p-4 space-y-1 border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/20">
          <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">Total a Receber</span>
          <div className="font-bebas text-3xl text-amber-600 dark:text-amber-400 leading-none">
            {fmt(totalOpenAmount)}
          </div>
          <p className="text-[10px] text-slate-500">Soma de todas as comandas ativas</p>
        </div>

        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">Total de Comandas Hoje</span>
          <div className="font-bebas text-3xl text-[var(--text-primary)] leading-none">
            {tabs.length}
          </div>
          <p className="text-[10px] text-slate-400">Abertas e finalizadas</p>
        </div>
      </div>

      {/* Filtros de Status */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('open')}
          className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
            filter === 'open'
              ? 'bg-[#1A6B2E] text-white border-[#1A6B2E] shadow-xs dark:bg-emerald-600'
              : 'bg-[var(--bg-card)] text-slate-600 dark:text-slate-400 border-[var(--border-color)]'
          }`}
        >
          Abertas ({openTabsCount})
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
            filter === 'closed'
              ? 'bg-[#1A6B2E] text-white border-[#1A6B2E] shadow-xs dark:bg-emerald-600'
              : 'bg-[var(--bg-card)] text-slate-600 dark:text-slate-400 border-[var(--border-color)]'
          }`}
        >
          Fechadas / Pagas ({tabs.length - openTabsCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[#1A6B2E] text-white border-[#1A6B2E] shadow-xs dark:bg-emerald-600'
              : 'bg-[var(--bg-card)] text-slate-600 dark:text-slate-400 border-[var(--border-color)]'
          }`}
        >
          Todas ({tabs.length})
        </button>
      </div>

      {/* Grid de Cards de Comandas */}
      {filteredTabs.length === 0 ? (
        <div className="card-app py-16 text-center space-y-2">
          <ClipboardList className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma comanda encontrada.</p>
          <p className="text-xs text-slate-500">Abra uma nova comanda direto na tela do PDV.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTabs.map((tab) => {
            const isOpen = tab.status === 'open'
            const numPlayers = splitPlayers[tab.id] || 8
            const splitAmount = tab.total_amount > 0 ? tab.total_amount / numPlayers : 0

            return (
              <div
                key={tab.id}
                className={`card-app p-5 space-y-4 hover:border-[#1A6B2E] transition-all shadow-xs flex flex-col justify-between ${
                  isOpen ? 'border-amber-300 dark:border-amber-800' : 'opacity-85'
                }`}
              >
                <div className="space-y-3">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bebas text-2xl text-[var(--text-primary)] leading-none">
                          #{tab.tab_number}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isOpen
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-[#C8E6C9] text-[#0D4A1C] dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isOpen ? '● Em Aberto' : '✓ Paga'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[var(--text-primary)] mt-1">
                        {tab.client_name}
                      </h3>
                      <p className="text-xs text-slate-500">📍 {tab.court_or_class || 'Quadra'}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total</span>
                      <span className="font-bebas text-3xl text-[#1A6B2E] dark:text-emerald-400 leading-none">
                        {fmt(tab.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Itens Consumidos */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {(tab.items || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 text-center">Nenhum item lançado ainda.</p>
                    ) : (
                      tab.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                        >
                          <div className="truncate">
                            <span className="font-bold">{item.quantity}x</span>{' '}
                            <span className="text-slate-700 dark:text-slate-300">{item.product_name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold">{fmt(item.total_price)}</span>
                            {isOpen && (
                              <button
                                onClick={() => handleRemoveItem(item.id, tab.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Estornar item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Calculadora de Divisão por Jogador na Pelada */}
                  {isOpen && tab.total_amount > 0 && (
                    <div className="p-3 rounded bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          Dividir entre Jogadores:
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={numPlayers}
                            onChange={(e) =>
                              setSplitPlayers({
                                ...splitPlayers,
                                [tab.id]: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-12 h-6 text-center font-bold bg-white dark:bg-zinc-800 border border-amber-300 rounded text-xs font-mono"
                          />
                          <span className="text-[10px] text-amber-700 dark:text-amber-400">atletas</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-amber-200/50">
                        <span className="text-[11px] text-amber-800 dark:text-amber-300">Valor individual:</span>
                        <span className="font-bebas text-lg text-amber-700 dark:text-amber-400 font-bold">
                          {fmt(splitAmount)} / pessoa no PIX
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="pt-3 border-t border-[var(--border-color)]">
                  {isOpen ? (
                    <button
                      onClick={() => setSelectedCloseTab(tab)}
                      className="w-full py-2.5 bg-[#1A6B2E] hover:bg-[#0D4A1C] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      Fechar & Receber Conta
                    </button>
                  ) : (
                    <div className="text-center text-[11px] text-slate-400 font-mono">
                      Fechada em {tab.closed_at ? new Date(tab.closed_at).toLocaleTimeString('pt-BR').slice(0, 5) : '—'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DE FECHAMENTO DE CONTA DA COMANDA */}
      {selectedCloseTab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-app bg-[var(--bg-card)] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                  Fechar Comanda #{selectedCloseTab.tab_number}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCloseTab.client_name}</p>
              </div>
              <button
                onClick={() => setSelectedCloseTab(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500">Valor Total da Comanda</span>
              <span className="font-bebas text-3xl text-[#1A6B2E] dark:text-emerald-400 leading-none">
                {fmt(selectedCloseTab.total_amount)}
              </span>
            </div>

            {/* Formas de Pagamento */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Selecione como foi pago:
              </span>

              <button
                onClick={() => handleCloseTab('pix')}
                disabled={isPending}
                className="w-full p-3 rounded border border-[#1A6B2E]/30 bg-[#C8E6C9]/20 hover:bg-[#C8E6C9]/50 flex items-center justify-between text-xs font-bold text-[#0D4A1C] dark:text-emerald-300"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#1A6B2E]" />
                  <span>PIX Instantâneo</span>
                </div>
                <span>{fmt(selectedCloseTab.total_amount)}</span>
              </button>

              <button
                onClick={() => handleCloseTab('credit_card')}
                disabled={isPending}
                className="w-full p-3 rounded border border-blue-200 bg-blue-50/50 hover:bg-blue-50 flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Cartão de Crédito / Débito</span>
                </div>
                <span>{fmt(selectedCloseTab.total_amount)}</span>
              </button>

              <button
                onClick={() => handleCloseTab('cash')}
                disabled={isPending}
                className="w-full p-3 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Dinheiro em Espécie</span>
                </div>
                <span>{fmt(selectedCloseTab.total_amount)}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCloseTab(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold uppercase"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
