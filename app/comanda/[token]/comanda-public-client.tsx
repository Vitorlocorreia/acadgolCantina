'use client'

import { useState } from 'react'
import {
  Users,
  Copy,
  Check,
  Share2,
  QrCode,
  RotateCw,
  Beer,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  tab: any
}

function fmt(val: number) {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ComandaPublicClient({ tab }: Props) {
  const router = useRouter()
  const [numPlayers, setNumPlayers] = useState(8)
  const [copiedPix, setCopiedPix] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const pixKey = '81985742015'
  const total = Number(tab.total_amount || 0)
  const paid = Number(tab.paid_amount || 0)
  const remaining = Math.max(0, total - paid)
  const isClosed = tab.status === 'closed'

  const splitPerPerson = remaining > 0 ? remaining / numPlayers : total / numPlayers

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey)
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 2000)
  }

  const buildWhatsAppShare = () => {
    const itemsText = (tab.items || [])
      .map((i: any) => `• ${i.quantity}x ${i.product_name} - ${fmt(i.total_price)}`)
      .join('\n')

    const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

    const text = `⚽ *ACADEMIA DO GOL — CONTA DA PELADA* 🍻\n` +
      `📍 *${tab.client_name}* (${tab.court_or_class || 'Quadra'})\n` +
      `Comanda #${tab.tab_number}\n\n` +
      `📋 *Itens Consumidos:*\n${itemsText || '• Em consumo'}\n\n` +
      `💰 *Total Consumido:* ${fmt(total)}\n` +
      (paid > 0 ? `✅ *Já Pago:* ${fmt(paid)}\n` : '') +
      `🔴 *Restante a Pagar:* ${fmt(remaining)}\n\n` +
      `👥 *Divisão:* ${numPlayers} atletas = *${fmt(splitPerPerson)} por pessoa*\n\n` +
      `🔑 *Chave PIX:* ${pixKey} (Academia do Gol)\n\n` +
      `📲 *Acompanhe em tempo real:* ${currentUrl}`

    return `https://wa.me/?text=${encodeURIComponent(text)}`
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-5">
        {/* Topo / Header da Cantina */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#1A6B2E] flex items-center justify-center font-black text-white text-lg shadow-md shadow-emerald-950">
                ⚽
              </div>
              <div>
                <h1 className="font-bebas text-2xl tracking-wider text-white leading-none">
                  ACADEMIA DO GOL
                </h1>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Comanda Digital da Pelada
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
              title="Atualizar itens em tempo real"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bebas text-3xl text-emerald-400 leading-none">
                  #{tab.tab_number}
                </span>
                <span className="font-bold text-base text-white">{tab.client_name}</span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                {tab.court_or_class || 'Quadra / Campo'}
              </p>
            </div>

            <div>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isClosed
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                }`}
              >
                {isClosed ? '✓ Finalizada' : '● Em Consumo'}
              </span>
            </div>
          </div>
        </div>

        {/* Cards de Resumo Financeiro */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total</span>
            <span className="font-bebas text-xl text-white">{fmt(total)}</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Já Pago</span>
            <span className="font-bebas text-xl text-emerald-400">{fmt(paid)}</span>
          </div>

          <div className="bg-zinc-900 border border-amber-900/50 bg-amber-950/20 rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">A Pagar</span>
            <span className="font-bebas text-xl text-amber-400">{fmt(remaining)}</span>
          </div>
        </div>

        {/* Barra de Progresso de Quitação */}
        {total > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-zinc-400">
              <span>Status do Pagamento da Mesa</span>
              <span className="text-emerald-400">{percentPaid}% Quitado</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${percentPaid}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista de Itens Consumidos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <h2 className="font-bebas text-xl text-white tracking-wider flex items-center gap-2">
              <Beer className="w-4 h-4 text-amber-400" />
              Consumo da Turma
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              {(tab.items || []).length} iten(s)
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {(tab.items || []).length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                Nenhum item lançado ainda.
              </div>
            ) : (
              tab.items.map((item: any) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-emerald-400">{item.quantity}x</span>{' '}
                    <span className="text-zinc-200">{item.product_name}</span>
                    <span className="block text-[10px] text-zinc-500 font-mono">
                      {fmt(item.unit_price)} un
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white shrink-0">
                    {fmt(item.total_price)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Divisor Interativo da Pelada */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bebas text-xl text-amber-400 tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Dividir Conta da Pelada
            </h3>
            <span className="text-xs text-zinc-400">Tempo real</span>
          </div>

          <div className="flex items-center justify-between bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-300 font-bold">Quantos jogaram?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNumPlayers((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-sm cursor-pointer"
              >
                -
              </button>
              <span className="w-8 text-center font-bebas text-2xl text-amber-400">
                {numPlayers}
              </span>
              <button
                onClick={() => setNumPlayers((p) => Math.min(30, p + 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-sm cursor-pointer"
              >
                +
              </button>
              <span className="text-[11px] text-zinc-400">atletas</span>
            </div>
          </div>

          <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl text-center space-y-1">
            <span className="text-[11px] uppercase font-bold text-amber-300 tracking-wider">
              Valor Individual
            </span>
            <div className="font-bebas text-4xl text-amber-400 leading-none">
              {fmt(splitPerPerson)}
            </div>
            <p className="text-[11px] text-zinc-400">por jogador no PIX</p>
          </div>

          {/* Dados do PIX com Copiar Rápido */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Chave PIX (Telefone):</span>
              <span className="font-mono font-bold text-white">{pixKey}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Favorecido:</span>
              <span className="font-bold text-zinc-300">Academia do Gol Ltda</span>
            </div>

            <button
              onClick={handleCopyPix}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedPix ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Chave Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Chave PIX
                </>
              )}
            </button>
          </div>

          {/* Botão Compartilhar no Grupo da Pelada */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={buildWhatsAppShare()}
              target="_blank"
              rel="noreferrer"
              className="py-3 bg-[#1A6B2E] hover:bg-[#0D4A1C] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Enviar no Grupo
            </a>

            <button
              onClick={handleCopyLink}
              className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copiado!</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Copiar Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Rodapé Seguro */}
        <div className="text-center text-[10px] text-zinc-500 py-4 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Comanda transparente oficial — Academia do Gol
          </p>
          <p>Atualizado automaticamente em tempo real</p>
        </div>
      </div>
    </div>
  )
}
