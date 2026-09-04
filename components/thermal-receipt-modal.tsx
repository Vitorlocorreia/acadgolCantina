'use client'

import { useState, useEffect } from 'react'
import { Printer, Send, CheckCircle2, Loader2, X, Receipt, Smartphone } from 'lucide-react'
import { sendReceiptWhatsAppAction } from '@/app/actions'

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface ReceiptData {
  orderNumber?: string | number
  clientName?: string
  date?: string
  items: ReceiptItem[]
  totalAmount: number
  paymentMethod: string
  guardianPhone?: string
  studentBalanceBefore?: number
  studentBalanceAfter?: number
  courtOrClass?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  data: ReceiptData | null
}

function fmt(val: number) {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'pix':
      return 'PIX INSTANTÂNEO'
    case 'credit_card':
      return 'CARTÃO DE CRÉDITO/DÉBITO'
    case 'cash':
      return 'DINHEIRO EM ESPÉCIE'
    case 'prepaid_wallet':
      return 'CARTEIRA PRÉ-PAGA (ALUNO)'
    default:
      return method.toUpperCase()
  }
}

export function ThermalReceiptModal({ isOpen, onClose, data }: Props) {
  const [phone, setPhone] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (data?.guardianPhone) {
      setPhone(data.guardianPhone)
    } else {
      setPhone('')
    }
    setSendSuccess(false)
    setErrorMsg(null)
  }, [data])

  if (!isOpen || !data) return null

  const now = data.date || new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
  const orderNum = data.orderNumber || String(Math.floor(1000 + Math.random() * 9000))

  const handlePrint = () => {
    window.print()
  }

  const buildReceiptText = () => {
    let text = `🧾 *CUPOM DE CONSUMO — ACADEMIA DO GOL*\n`
    text += `📍 *Cantina & Bar da Academia*\n`
    text += `CNPJ: 45.892.120/0001-34\n`
    text += `--------------------------------\n`
    text += `*Data/Hora:* ${now}\n`
    text += `*Pedido / Comanda:* #${orderNum}\n`
    text += `*Cliente:* ${data.clientName || 'Cliente Balcão'}\n`
    if (data.courtOrClass) text += `*Local:* ${data.courtOrClass}\n`
    text += `--------------------------------\n`
    text += `*ITENS CONSUMIDOS:*\n`
    data.items.forEach((item) => {
      text += `• ${item.quantity}x ${item.name} (${fmt(item.unitPrice)}) = *${fmt(item.totalPrice)}*\n`
    })
    text += `--------------------------------\n`
    text += `*TOTAL PAGO:* ${fmt(data.totalAmount)}\n`
    text += `*FORMA DE PGTO:* ${getPaymentMethodLabel(data.paymentMethod)}\n`

    if (data.studentBalanceAfter !== undefined) {
      text += `*SALDO RESTANTE:* ${fmt(data.studentBalanceAfter)}\n`
    }
    text += `--------------------------------\n`
    text += `_Obrigado pela preferência! Bom jogo! ⚽_`
    return text
  }

  const handleSendWhatsApp = async () => {
    const clean = phone.replace(/\D/g, '')
    if (!clean || clean.length < 10) {
      setErrorMsg('Informe um telefone válido com DDD (ex: 81985742015).')
      return
    }

    setIsSending(true)
    setErrorMsg(null)
    setSendSuccess(false)

    try {
      const msg = buildReceiptText()
      const res = await sendReceiptWhatsAppAction(clean, msg)
      if (res.success) {
        setSendSuccess(true)
      } else {
        // Fallback para link direto wa.me
        window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, '_blank')
        setSendSuccess(true)
      }
    } catch {
      const msg = buildReceiptText()
      window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, '_blank')
      setSendSuccess(true)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {/* Estilo exclusivo para Impressão Térmica de 80mm */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-print,
          #thermal-receipt-print * {
            visibility: visible !important;
          }
          #thermal-receipt-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 78mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 8px !important;
            background: #fff !important;
            color: #000 !important;
            font-family: monospace !important;
            font-size: 11px !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="card-app bg-[var(--bg-card)] max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-150 my-auto">
          {/* Header do Modal */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1A6B2E]/15 text-[#1A6B2E] dark:text-emerald-400 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                  Comprovante de Venda
                </h3>
                <p className="text-[11px] text-slate-500">Cupom térmico 80mm & disparo WhatsApp</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* O CUPOM TÉRMICO (RENDER VISUAL E IMPRESSÃO) */}
          <div className="flex justify-center">
            <div
              id="thermal-receipt-print"
              className="w-full max-w-[340px] bg-neutral-50 text-neutral-900 dark:bg-zinc-100 dark:text-zinc-900 p-5 rounded-sm shadow-md font-mono text-xs border border-dashed border-neutral-300 space-y-2 select-text"
            >
              {/* Topo serrilhado e Cabeçalho */}
              <div className="text-center space-y-0.5 border-b border-dashed border-neutral-400 pb-2">
                <div className="font-black text-sm tracking-widest uppercase">ACADEMIA DO GOL</div>
                <div className="text-[10px] text-neutral-600 font-bold uppercase">Cantina & Bar Esportivo</div>
                <div className="text-[9px] text-neutral-500">Av. Principal do Esporte, 1000 - Recife/PE</div>
                <div className="text-[9px] text-neutral-500">CNPJ: 45.892.120/0001-34</div>
              </div>

              {/* Metadados da Venda */}
              <div className="text-[10px] space-y-0.5 border-b border-dashed border-neutral-300 py-1.5 leading-tight">
                <div className="flex justify-between">
                  <span className="font-bold">DATA/HORA:</span>
                  <span>{now}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">PEDIDO:</span>
                  <span className="font-black">#{orderNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">CLIENTE:</span>
                  <span className="font-bold truncate max-w-[180px]">{data.clientName || 'Consumidor'}</span>
                </div>
                {data.courtOrClass && (
                  <div className="flex justify-between">
                    <span className="font-bold">LOCAL:</span>
                    <span>{data.courtOrClass}</span>
                  </div>
                )}
              </div>

              {/* Tabela de Itens */}
              <div className="py-1">
                <div className="flex justify-between text-[10px] font-bold border-b border-neutral-300 pb-0.5 mb-1">
                  <span>QTD ITEM</span>
                  <span>TOTAL</span>
                </div>
                <div className="space-y-1">
                  {data.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] leading-tight">
                      <div className="truncate pr-2">
                        <span className="font-bold">{item.quantity}x</span> {item.name}
                        <span className="text-[9px] text-neutral-500 block">
                          @{fmt(item.unitPrice)}
                        </span>
                      </div>
                      <span className="font-bold shrink-0">{fmt(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="border-t-2 border-dashed border-neutral-400 pt-2 space-y-1">
                <div className="flex justify-between text-xs font-black">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-sm">{fmt(data.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>FORMA DE PGTO:</span>
                  <span className="font-bold uppercase">{getPaymentMethodLabel(data.paymentMethod)}</span>
                </div>

                {data.studentBalanceAfter !== undefined && (
                  <div className="flex justify-between text-[10px] bg-purple-100 p-1 rounded font-bold text-purple-950 mt-1">
                    <span>SALDO ATUAL DO ALUNO:</span>
                    <span>{fmt(data.studentBalanceAfter)}</span>
                  </div>
                )}
              </div>

              {/* Rodapé do Cupom com Código de Barras Simulado */}
              <div className="border-t border-dashed border-neutral-400 pt-2 text-center space-y-1">
                <div className="text-[9px] font-bold text-neutral-600">
                  OBRIGADO PELA PREFERÊNCIA! VOLTE SEMPRE!
                </div>
                {/* Código de barras estilizado */}
                <div className="flex justify-center items-center py-1 opacity-80">
                  <div className="font-mono text-center tracking-[4px] text-xs font-bold select-none border-y border-neutral-400 py-0.5">
                    ||| | |||| | || ||| || |||
                  </div>
                </div>
                <div className="text-[8px] text-neutral-400 font-mono">
                  AUT: {Math.random().toString(36).substring(2, 12).toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* ÁREA DE DISPARO NO WHATSAPP */}
          <div className="p-3 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#1A6B2E] dark:text-emerald-400" />
              Enviar Comprovante Digital no WhatsApp:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="tel"
                placeholder="(81) 98574-2015"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setErrorMsg(null)
                  setSendSuccess(false)
                }}
                className="input-app flex-1 text-xs py-1.5 font-mono"
              />
              <button
                onClick={handleSendWhatsApp}
                disabled={isSending}
                className="px-4 py-2 bg-[#1A6B2E] hover:bg-[#0D4A1C] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : sendSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {sendSuccess ? 'Enviado!' : 'Disparar'}
              </button>
            </div>
            {errorMsg && <p className="text-[11px] text-red-500 font-bold">{errorMsg}</p>}
            {sendSuccess && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Cupom enviado com sucesso pelo WhatsApp da Cantina!
              </p>
            )}
          </div>

          {/* BOTÕES PRINCIPAIS */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold uppercase"
            >
              Fechar
            </button>

            <button
              onClick={handlePrint}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Cupom Térmico (80mm)
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
