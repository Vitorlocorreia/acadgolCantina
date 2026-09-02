'use client'

import { useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  QrCode,
  CreditCard,
  Banknote,
  Wallet,
  Calendar,
  CheckCircle2,
  Printer,
} from 'lucide-react'

interface Props {
  sales: any[]
}

function fmt(val: number) {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CaixaClient({ sales }: Props) {
  const [filterMethod, setFilterMethod] = useState('all')

  const totalSalesAmount = sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0)

  const pixTotal = sales
    .filter((s) => s.payment_method === 'pix')
    .reduce((acc, s) => acc + Number(s.total_amount || 0), 0)

  const cardTotal = sales
    .filter((s) => s.payment_method === 'credit_card' || s.payment_method === 'debit_card')
    .reduce((acc, s) => acc + Number(s.total_amount || 0), 0)

  const cashTotal = sales
    .filter((s) => s.payment_method === 'cash')
    .reduce((acc, s) => acc + Number(s.total_amount || 0), 0)

  const walletTotal = sales
    .filter((s) => s.payment_method === 'prepaid_wallet')
    .reduce((acc, s) => acc + Number(s.total_amount || 0), 0)

  const filteredSales = sales.filter((s) =>
    filterMethod === 'all' ? true : s.payment_method === filterMethod
  )

  return (
    <div className="space-y-6">
      {/* KPI Cards de Faturamento */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card-app p-4 space-y-1 col-span-2 lg:col-span-1 border-[#1A6B2E]/30 bg-[#C8E6C9]/20 dark:bg-emerald-950/20">
          <span className="text-xs font-bold uppercase text-[#0D4A1C] dark:text-emerald-300">Total Faturado</span>
          <div className="font-bebas text-3xl text-[#1A6B2E] dark:text-emerald-400 leading-none">
            {fmt(totalSalesAmount)}
          </div>
          <p className="text-[10px] text-[#0D4A1C] dark:text-emerald-400 font-bold">{sales.length} vendas registradas</p>
        </div>

        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-[#1A6B2E]" /> PIX
          </span>
          <div className="font-bebas text-2xl text-[var(--text-primary)] leading-none">
            {fmt(pixTotal)}
          </div>
          <p className="text-[10px] text-slate-400">
            {totalSalesAmount > 0 ? ((pixTotal / totalSalesAmount) * 100).toFixed(0) : 0}% do faturamento
          </p>
        </div>

        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Cartão
          </span>
          <div className="font-bebas text-2xl text-[var(--text-primary)] leading-none">
            {fmt(cardTotal)}
          </div>
          <p className="text-[10px] text-slate-400">Crédito e Débito</p>
        </div>

        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-purple-600" /> Saldo Alunos
          </span>
          <div className="font-bebas text-2xl text-purple-600 dark:text-purple-400 leading-none">
            {fmt(walletTotal)}
          </div>
          <p className="text-[10px] text-slate-400">Carteira Escolinha</p>
        </div>

        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Dinheiro
          </span>
          <div className="font-bebas text-2xl text-[var(--text-primary)] leading-none">
            {fmt(cashTotal)}
          </div>
          <p className="text-[10px] text-slate-400">Espécie em Gaveta</p>
        </div>
      </div>

      {/* Tabela de Vendas / Extrato do Caixa */}
      <div className="card-app overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1A6B2E] dark:text-emerald-400" />
            <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
              Histórico de Vendas & Cupons Fiscais
            </h3>
          </div>

          {/* Filtros por Método */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', 'pix', 'credit_card', 'prepaid_wallet', 'cash'].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-3 py-1 rounded-[6px] text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  filterMethod === m
                    ? 'bg-[#1A6B2E] text-white border-[#1A6B2E] shadow-xs dark:bg-emerald-600'
                    : 'bg-[var(--bg-card)] text-slate-600 dark:text-slate-400 border-[var(--border-color)]'
                }`}
              >
                {m === 'all'
                  ? 'Todos'
                  : m === 'pix'
                  ? 'PIX'
                  : m === 'credit_card'
                  ? 'Cartão'
                  : m === 'prepaid_wallet'
                  ? 'Saldo Aluno'
                  : 'Dinheiro'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-color)] text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3">Horário / Data</th>
                <th className="px-5 py-3">Cliente / Origem</th>
                <th className="px-5 py-3">Itens Consumidos</th>
                <th className="px-5 py-3 text-center">Pagamento</th>
                <th className="px-5 py-3 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Nenhuma venda registrada para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {new Date(sale.created_at).toLocaleTimeString('pt-BR')} (
                      {new Date(sale.created_at).toLocaleDateString('pt-BR')})
                    </td>

                    <td className="px-5 py-3.5 font-bold text-[var(--text-primary)]">
                      {sale.client_name || 'Balcão'}
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {sale.items_summary || 'Itens diversos'}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-subtle)] border border-[var(--border-color)]">
                        {sale.payment_method === 'pix'
                          ? 'PIX'
                          : sale.payment_method === 'credit_card'
                          ? 'Cartão Crédito'
                          : sale.payment_method === 'debit_card'
                          ? 'Cartão Débito'
                          : sale.payment_method === 'prepaid_wallet'
                          ? 'Saldo Aluno'
                          : 'Dinheiro'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-[#1A6B2E] dark:text-emerald-400">
                      {fmt(sale.total_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
