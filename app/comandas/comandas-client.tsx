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
  Copy,
  Check,
  Share2,
  Printer,
  ExternalLink,
  Coins,
  Receipt,
} from 'lucide-react'
import { closeTabAction, payTabPartialAction } from '../actions'
import { removeTabItemAction } from './actions'
import { ThermalReceiptModal, ReceiptData } from '@/components/thermal-receipt-modal'
import { playCashRegister } from '@/lib/audio/sound-effects'

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
  const [selectedPartialTab, setSelectedPartialTab] = useState<any | null>(null)
  const [partialAmount, setPartialAmount] = useState<number>(20)
  const [partialPayer, setPartialPayer] = useState('')
  const [selectedQrTab, setSelectedQrTab] = useState<any | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [splitPlayers, setSplitPlayers] = useState<{ [tabId: string]: number }>({})
  const [copiedTabId, setCopiedTabId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const filteredTabs = tabs.filter((t) => (filter === 'all' ? true : t.status === filter))

  const handleCloseTab = (paymentMethod: string) => {
    if (!selectedCloseTab) return
    const tabToClose = selectedCloseTab
    startTransition(async () => {
      const res = await closeTabAction(tabToClose.id, paymentMethod)
      if (res.success) {
        playCashRegister()
        setFeedback(`Comanda #${tabToClose.tab_number} quitada e fechada com sucesso via ${paymentMethod.toUpperCase()}!`)
        
        // Abre Cupom Térmico
        setReceiptData({
          orderNumber: tabToClose.tab_number,
          clientName: tabToClose.client_name,
          courtOrClass: tabToClose.court_or_class,
          items: (tabToClose.items || []).map((i: any) => ({
            name: i.product_name,
            quantity: i.quantity,
            unitPrice: Number(i.unit_price),
            totalPrice: Number(i.total_price),
          })),
          totalAmount: Number(tabToClose.total_amount),
          paymentMethod: paymentMethod,
        })

        setSelectedCloseTab(null)
      }
    })
  }

  const handlePartialPayment = (paymentMethod: string) => {
    if (!selectedPartialTab || partialAmount <= 0) return
    const tab = selectedPartialTab
    startTransition(async () => {
      const res = await payTabPartialAction(tab.id, partialAmount, paymentMethod, partialPayer)
      if (res.success) {
        playCashRegister()
        setFeedback(`Pagamento parcial de ${fmt(partialAmount)} registrado na Comanda #${tab.tab_number} via ${paymentMethod.toUpperCase()}!`)
        setSelectedPartialTab(null)
        setPartialAmount(20)
        setPartialPayer('')
      } else {
        setFeedback(res.error || 'Erro ao registrar pagamento parcial.')
      }
    })
  }

  const handleRemoveItem = (itemId: string, tabId: string) => {
    startTransition(async () => {
      await removeTabItemAction(itemId, tabId)
    })
  }

  const handleCopyWhatsappText = (tab: any) => {
    const numAthletes = splitPlayers[tab.id] || 8
    const total = Number(tab.total_amount || 0)
    const paid = Number(tab.paid_amount || 0)
    const remaining = Math.max(0, total - paid)
    const perPerson = remaining > 0 ? remaining / numAthletes : total / numAthletes

    const itemsText = (tab.items || [])
      .map((i: any) => `• ${i.quantity}x ${i.product_name} - ${fmt(i.total_price)}`)
      .join('\n')

    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/comanda/${tab.share_token}`
      : `https://acadgolcantina.vercel.app/comanda/${tab.share_token}`

    const message = `⚽ *ACADEMIA DO GOL — CONTA DA PELADA* 🍻\n` +
      `📍 *${tab.client_name}* (${tab.court_or_class || 'Quadra'})\n` +
      `Comanda #${tab.tab_number}\n\n` +
      `📋 *Consumo da Mesa:*\n${itemsText || '• Em consumo'}\n\n` +
      `💰 *Total Consumido:* ${fmt(total)}\n` +
      (paid > 0 ? `✅ *Já Pago:* ${fmt(paid)}\n` : '') +
      `🔴 *Restante a Pagar:* ${fmt(remaining)}\n\n` +
      `👥 *Divisão:* ${numAthletes} atletas = *${fmt(perPerson)} por pessoa*\n\n` +
      `🔑 *Chave PIX:* 81985742015 (Academia do Gol)\n\n` +
      `📲 *Acompanhe a conta em tempo real:* ${shareUrl}`

    navigator.clipboard.writeText(message)
    setCopiedTabId(tab.id)
    setTimeout(() => setCopiedTabId(null), 2500)
  }

  const openThermalReceiptForTab = (tab: any) => {
    setReceiptData({
      orderNumber: tab.tab_number,
      clientName: tab.client_name,
      courtOrClass: tab.court_or_class,
      items: (tab.items || []).map((i: any) => ({
        name: i.product_name,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
        totalPrice: Number(i.total_price),
      })),
      totalAmount: Number(tab.total_amount),
      paymentMethod: tab.status === 'closed' ? 'quitado' : 'pendente',
    })
  }

  const openTabsCount = tabs.filter((t) => t.status === 'open').length
  const totalOpenAmount = tabs
    .filter((t) => t.status === 'open')
    .reduce((acc, t) => acc + Math.max(0, Number(t.total_amount || 0) - Number(t.paid_amount || 0)), 0)

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3.5 rounded bg-[#C8E6C9]/60 border border-[#1A6B2E]/30 text-[#0D4A1C] text-xs font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
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
          <p className="text-[10px] text-slate-400">Em consumo ativo nas quadras</p>
        </div>

        <div className="card-app p-4 space-y-1 border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/20">
          <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">Saldo Pendente a Receber</span>
          <div className="font-bebas text-3xl text-amber-600 dark:text-amber-400 leading-none">
            {fmt(totalOpenAmount)}
          </div>
          <p className="text-[10px] text-slate-500">Total a liquidar (descontados adiantamentos)</p>
        </div>

        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">Total de Comandas Hoje</span>
          <div className="font-bebas text-3xl text-[var(--text-primary)] leading-none">
            {tabs.length}
          </div>
          <p className="text-[10px] text-slate-400">Abertas e quitadas</p>
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
          Fechadas / Quitadas ({tabs.length - openTabsCount})
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
            const total = Number(tab.total_amount || 0)
            const paid = Number(tab.paid_amount || 0)
            const remaining = Math.max(0, total - paid)
            const splitAmount = remaining > 0 ? remaining / numPlayers : total / numPlayers
            const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0

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
                          {isOpen ? '● Em Aberto' : '✓ Quitado'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[var(--text-primary)] mt-1">
                        {tab.client_name}
                      </h3>
                      <p className="text-xs text-slate-500">📍 {tab.court_or_class || 'Quadra'}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Botão QR Code da Comanda */}
                      <button
                        onClick={() => setSelectedQrTab(tab)}
                        className="p-1.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--border-color)] text-slate-600 dark:text-slate-300 transition-colors"
                        title="Ver QR Code da Comanda para Celular"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      {/* Botão Cupom Térmico */}
                      <button
                        onClick={() => openThermalReceiptForTab(tab)}
                        className="p-1.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--border-color)] text-slate-600 dark:text-slate-300 transition-colors"
                        title="Imprimir Cupom Térmico"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Resumo Financeiro da Comanda com Pagamento Parcial */}
                  <div className="bg-[var(--bg-subtle)] p-3 rounded border border-[var(--border-color)] space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Consumo Total:</span>
                      <span className="font-bebas text-xl text-[var(--text-primary)]">{fmt(total)}</span>
                    </div>

                    {paid > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Já Pago / Abatido:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmt(paid)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-[var(--border-color)]">
                      <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">
                        {isOpen ? 'Restante a Pagar:' : 'Total Quitado:'}
                      </span>
                      <span className="font-bebas text-2xl text-[#1A6B2E] dark:text-emerald-400 leading-none">
                        {fmt(isOpen ? remaining : total)}
                      </span>
                    </div>

                    {/* Barra de Progresso se houver pagamento parcial */}
                    {paid > 0 && isOpen && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>Progresso da Conta</span>
                          <span>{percentPaid}% pago</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lista de Itens Consumidos */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
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
                                className="text-red-500 hover:text-red-700 cursor-pointer"
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

                  {/* Calculadora de Divisão por Jogador + Botão de Envio WhatsApp */}
                  {isOpen && total > 0 && (
                    <div className="p-3 rounded bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          Dividir entre Atletas:
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
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                          Valor individual:
                        </span>
                        <span className="font-bebas text-lg text-amber-700 dark:text-amber-400 font-bold">
                          {fmt(splitAmount)} / atleta
                        </span>
                      </div>

                      {/* Botão de Disparo do Texto no WhatsApp da Pelada */}
                      <button
                        onClick={() => handleCopyWhatsappText(tab)}
                        className="w-full py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-400/40 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedTabId === tab.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#1A6B2E] dark:text-emerald-400" />
                            <span className="text-[#1A6B2E] dark:text-emerald-400 font-black">
                              Texto do WhatsApp Copiado!
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Mensagem para Grupo do WhatsApp
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Botões de Ação da Comanda */}
                <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
                  {isOpen ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedPartialTab(tab)
                          setPartialAmount(Math.min(20, remaining))
                        }}
                        className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                        title="Registrar pagamento parcial (ex: um amigo pagou o dele no PIX)"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        Abater Parcial
                      </button>

                      <button
                        onClick={() => setSelectedCloseTab(tab)}
                        className="py-2.5 bg-[#1A6B2E] hover:bg-[#0D4A1C] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Quitar Restante
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Fechada em {tab.closed_at ? new Date(tab.closed_at).toLocaleTimeString('pt-BR').slice(0, 5) : '—'}</span>
                      <button
                        onClick={() => openThermalReceiptForTab(tab)}
                        className="text-[#1A6B2E] dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Ver Cupom
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DE PAGAMENTO PARCIAL / MULTIPLO */}
      {selectedPartialTab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-app bg-[var(--bg-card)] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                  Abater Pagamento Parcial
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comanda #{selectedPartialTab.tab_number} — {selectedPartialTab.client_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedPartialTab(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Consumo Total:</span>
                <span className="font-bold">{fmt(selectedPartialTab.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Já Quitado:</span>
                <span className="font-bold text-emerald-600">{fmt(selectedPartialTab.paid_amount || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-color)] pt-1">
                <span className="font-bold text-amber-700 dark:text-amber-300">Saldo Restante a Pagar:</span>
                <span className="font-bebas text-2xl text-amber-600 dark:text-amber-400 leading-none">
                  {fmt(selectedPartialTab.total_amount - (selectedPartialTab.paid_amount || 0))}
                </span>
              </div>
            </div>

            {/* Inputs de Valor e Pagador */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Valor a Abater Agora (R$):
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="1"
                  max={selectedPartialTab.total_amount - (selectedPartialTab.paid_amount || 0)}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(parseFloat(e.target.value) || 0)}
                  className="input-app font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Nome do Atleta que Pagou (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pedro Zagueiro"
                  value={partialPayer}
                  onChange={(e) => setPartialPayer(e.target.value)}
                  className="input-app"
                />
              </div>
            </div>

            {/* Formas de Pagamento Parcial */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Confirmar recebimento via:
              </span>

              <button
                onClick={() => handlePartialPayment('pix')}
                disabled={isPending || partialAmount <= 0}
                className="w-full p-2.5 rounded border border-[#1A6B2E]/30 bg-[#C8E6C9]/20 hover:bg-[#C8E6C9]/50 flex items-center justify-between text-xs font-bold text-[#0D4A1C] dark:text-emerald-300 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#1A6B2E]" />
                  <span>Abater no PIX</span>
                </div>
                <span>{fmt(partialAmount)}</span>
              </button>

              <button
                onClick={() => handlePartialPayment('credit_card')}
                disabled={isPending || partialAmount <= 0}
                className="w-full p-2.5 rounded border border-blue-200 bg-blue-50/50 hover:bg-blue-50 flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Abater no Cartão</span>
                </div>
                <span>{fmt(partialAmount)}</span>
              </button>

              <button
                onClick={() => handlePartialPayment('cash')}
                disabled={isPending || partialAmount <= 0}
                className="w-full p-2.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Abater em Dinheiro</span>
                </div>
                <span>{fmt(partialAmount)}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPartialTab(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold uppercase"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FECHAMENTO TOTAL / QUITAÇÃO RESTANTE */}
      {selectedCloseTab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-app bg-[var(--bg-card)] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                  Quitar Comanda #{selectedCloseTab.tab_number}
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

            {/* Resumo do Saldo Restante */}
            <div className="p-4 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 block">Saldo Restante a Pagar</span>
                {Number(selectedCloseTab.paid_amount || 0) > 0 && (
                  <span className="text-[10px] text-emerald-600 font-bold">
                    (Total: {fmt(selectedCloseTab.total_amount)} — Pago: {fmt(selectedCloseTab.paid_amount)})
                  </span>
                )}
              </div>
              <span className="font-bebas text-3xl text-[#1A6B2E] dark:text-emerald-400 leading-none">
                {fmt(selectedCloseTab.total_amount - Number(selectedCloseTab.paid_amount || 0))}
              </span>
            </div>

            {/* Formas de Pagamento */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Selecione como foi quitado o saldo restante:
              </span>

              <button
                onClick={() => handleCloseTab('pix')}
                disabled={isPending}
                className="w-full p-3 rounded border border-[#1A6B2E]/30 bg-[#C8E6C9]/20 hover:bg-[#C8E6C9]/50 flex items-center justify-between text-xs font-bold text-[#0D4A1C] dark:text-emerald-300 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#1A6B2E]" />
                  <span>PIX Instantâneo</span>
                </div>
                <span>{fmt(selectedCloseTab.total_amount - Number(selectedCloseTab.paid_amount || 0))}</span>
              </button>

              <button
                onClick={() => handleCloseTab('credit_card')}
                disabled={isPending}
                className="w-full p-3 rounded border border-blue-200 bg-blue-50/50 hover:bg-blue-50 flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Cartão de Crédito / Débito</span>
                </div>
                <span>{fmt(selectedCloseTab.total_amount - Number(selectedCloseTab.paid_amount || 0))}</span>
              </button>

              <button
                onClick={() => handleCloseTab('cash')}
                disabled={isPending}
                className="w-full p-3 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Dinheiro em Espécie</span>
                </div>
                <span>{fmt(selectedCloseTab.total_amount - Number(selectedCloseTab.paid_amount || 0))}</span>
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

      {/* MODAL QR CODE DA COMANDA NA MESA / QUADRA */}
      {selectedQrTab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-app bg-[var(--bg-card)] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-150 text-center">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 text-left">
              <div>
                <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                  QR Code da Mesa / Quadra
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comanda #{selectedQrTab.tab_number} — {selectedQrTab.client_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedQrTab(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Aponte a câmera do celular para ver o consumo ao vivo e dividir a conta:
            </p>

            {/* Imagem do QR Code gerada dinamicamente */}
            <div className="p-4 bg-white rounded-xl shadow-inner inline-block mx-auto border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/comanda/${selectedQrTab.share_token}`
                    : `https://acadgolcantina.vercel.app/comanda/${selectedQrTab.share_token}`
                )}`}
                alt="QR Code da Comanda"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`/comanda/${selectedQrTab.share_token}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-[#1A6B2E] hover:bg-[#0D4A1C] text-white rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir Página Pública da Comanda
              </a>

              <button
                onClick={() => setSelectedQrTab(null)}
                className="w-full py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold uppercase"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CUPOM TÉRMICO / WHATSAPP */}
      <ThermalReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  )
}
