'use client'

import { useState, useTransition } from 'react'
import {
  Wallet,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Clock,
  ShieldAlert,
  Gauge,
  Edit2,
  Check,
  X,
} from 'lucide-react'
import { depositStudentWalletAction } from '../actions'
import { updateDailyLimitAction } from './actions'

interface Props {
  students: any[]
  transactions: any[]
}

function fmt(val: number) {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CarteiraClient({ students, transactions }: Props) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [depositAmount, setDepositAmount] = useState<number>(50.00)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Modal de Limite Diário
  const [limitModalStudent, setLimitModalStudent] = useState<any | null>(null)
  const [newLimitValue, setNewLimitValue] = useState<string>('20.00')
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false)

  const filteredStudents = students.filter((st) =>
    st.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalBalance = students.reduce((acc, st) => {
    const b = Array.isArray(st.wallet) ? st.wallet[0]?.balance ?? 0 : st.wallet?.balance ?? 0
    return acc + Number(b)
  }, 0)

  const handleDeposit = () => {
    if (!selectedStudent || depositAmount <= 0) return
    startTransition(async () => {
      const res = await depositStudentWalletAction(selectedStudent.id, depositAmount, 'pix')
      if (res.success) {
        setFeedback(`Recarga de ${fmt(depositAmount)} confirmada para o atleta ${selectedStudent.name}!`)
        setSelectedStudent(null)
      }
    })
  }

  const openLimitModal = (student: any) => {
    setLimitModalStudent(student)
    const wallet = Array.isArray(student.wallet) ? student.wallet[0] : student.wallet
    if (wallet?.daily_limit !== null && wallet?.daily_limit !== undefined) {
      setNewLimitValue(String(wallet.daily_limit))
      setIsUnlimited(false)
    } else {
      setNewLimitValue('20.00')
      setIsUnlimited(true)
    }
  }

  const handleSaveDailyLimit = () => {
    if (!limitModalStudent) return
    const limit = isUnlimited ? null : parseFloat(newLimitValue) || null

    startTransition(async () => {
      const res = await updateDailyLimitAction(limitModalStudent.id, limit)
      if (res.success) {
        setFeedback(
          limit
            ? `Limite diário do atleta ${limitModalStudent.name} fixado em ${fmt(limit)}!`
            : `Limite diário do atleta ${limitModalStudent.name} removido (livre)!`
        )
        setLimitModalStudent(null)
      }
    })
  }

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">Saldo Total em Custódia</span>
          <div className="font-bebas text-3xl text-purple-600 dark:text-purple-400 leading-none">
            {fmt(totalBalance)}
          </div>
          <p className="text-[10px] text-slate-400">Crédito disponível dos alunos para lanches</p>
        </div>

        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">Atletas Cadastrados</span>
          <div className="font-bebas text-3xl text-[var(--text-primary)] leading-none">
            {students.length}
          </div>
          <p className="text-[10px] text-[#1A6B2E] font-medium">Com carteira digital ativa</p>
        </div>

        <div className="card-app p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-500">Consumos Pós-Treino</span>
          <div className="font-bebas text-3xl text-[var(--text-primary)] leading-none">
            {transactions.filter((t) => t.type === 'purchase').length}
          </div>
          <p className="text-[10px] text-slate-400">Débitos registrados no mês</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Alunos & Saldo (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="card-app overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-600" />
                Saldo dos Atletas da Escolinha
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar atleta..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-app pl-8 text-xs py-1.5"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-color)] text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3">Atleta</th>
                    <th className="px-4 py-3">Alergias / Restrições</th>
                    <th className="px-4 py-3">Limite Diário</th>
                    <th className="px-4 py-3 text-right">Saldo Atual</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredStudents.map((st) => {
                    const wallet = Array.isArray(st.wallet) ? st.wallet[0] : st.wallet
                    const balance = wallet?.balance ?? 0
                    const dailyLimit = wallet?.daily_limit
                    const medical = Array.isArray(st.medical) ? st.medical[0] : st.medical
                    const allergies = medical?.allergies
                    const guardian = Array.isArray(st.guardian) ? st.guardian[0] : st.guardian
                    const guardianPhone = guardian?.phone ? guardian.phone.replace(/\D/g, '') : ''

                    const whatsappMsg = `Olá ${guardian?.name || 'Responsável'}! Aqui é da Cantina da Academia do Gol. O saldo atual do atleta *${st.name}* para lanches pós-treino é de *${fmt(balance)}*. Gostaria de fazer uma recarga via PIX? Chave PIX: 81985742015 (Academia do Gol)`

                    return (
                      <tr key={st.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[var(--text-primary)]">{st.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {st.preferred_position} • {guardian?.name || 'Responsável'}
                          </span>
                        </td>

                        {/* Coluna Alergias */}
                        <td className="px-4 py-3.5">
                          {allergies ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900">
                              <ShieldAlert className="w-3 h-3 text-red-600" />
                              {allergies}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Nenhuma</span>
                          )}
                        </td>

                        {/* Coluna Limite Diário com Botão de Edição */}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => openLimitModal(st)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-[var(--border-color)] transition-colors cursor-pointer"
                            title="Alterar limite diário configurado pelos pais"
                          >
                            <Gauge className="w-3 h-3 text-amber-500" />
                            {dailyLimit ? `${fmt(dailyLimit)}/dia` : 'Sem limite'}
                            <Edit2 className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                          </button>
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono font-bold text-base text-purple-600 dark:text-purple-400">
                          {fmt(balance)}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {guardianPhone && (
                              <a
                                href={`https://wa.me/55${guardianPhone}?text=${encodeURIComponent(whatsappMsg)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 bg-[#1A6B2E]/10 hover:bg-[#1A6B2E]/20 text-[#0D4A1C] dark:text-emerald-300 rounded font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1"
                                title="Solicitar Recarga no WhatsApp"
                              >
                                <Send className="w-3 h-3" /> WhatsApp
                              </a>
                            )}

                            <button
                              onClick={() => setSelectedStudent(st)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Recarregar
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

        {/* Extrato Recente de Consumos (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-app p-5 space-y-3">
            <h3 className="font-bebas text-xl text-[var(--text-primary)] tracking-wider leading-none flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600" />
              Extrato de Consumo & Recargas
            </h3>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Nenhuma movimentação registrada.</p>
              ) : (
                transactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit'
                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                          {isDeposit ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
                          )}
                          <span>{tx.student?.name || 'Aluno'}</span>
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            isDeposit ? 'text-emerald-600' : 'text-purple-600'
                          }`}
                        >
                          {isDeposit ? '+' : '-'} {fmt(tx.amount)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{tx.description}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: RECARGA DE SALDO */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-app bg-[var(--bg-card)] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                  Recarga de Saldo — {selectedStudent.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Adicionar crédito pré-pago para consumo de lanche</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Selecione ou digite o valor da recarga:
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[20, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(val)}
                    className={`py-2 rounded border font-bebas text-lg cursor-pointer transition-all ${
                      depositAmount === val
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-[var(--bg-subtle)] border-[var(--border-color)] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    R$ {val},00
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="5"
                  min="5"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="input-app pl-8 font-mono text-base font-bold"
                />
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>Confirmar recebimento do PIX</span>
              </div>
              <p className="text-[11px] opacity-90">
                O saldo estará disponível imediatamente para o atleta comprar lanches no balcão da cantina.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold uppercase"
              >
                Cancelar
              </button>

              <button
                onClick={handleDeposit}
                disabled={isPending || depositAmount <= 0}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirmar Recarga ({fmt(depositAmount)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURAR LIMITE DIÁRIO POR CRIANÇA */}
      {limitModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-app bg-[var(--bg-card)] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                    Trava de Limite Diário
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{limitModalStudent.name}</p>
                </div>
              </div>
              <button
                onClick={() => setLimitModalStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Defina o teto máximo que o atleta pode gastar na cantina por dia, conforme acordado com os pais:
            </p>

            {/* Opções Pré-Definidas */}
            <div className="grid grid-cols-4 gap-2">
              {[15, 20, 30, 50].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setNewLimitValue(String(val))
                    setIsUnlimited(false)
                  }}
                  className={`py-2 rounded border font-bebas text-base cursor-pointer transition-all ${
                    !isUnlimited && parseFloat(newLimitValue) === val
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-color)] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  R$ {val}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Valor Personalizado (R$/dia):
              </label>
              <input
                type="number"
                step="1"
                min="5"
                disabled={isUnlimited}
                value={newLimitValue}
                onChange={(e) => setNewLimitValue(e.target.value)}
                className="input-app font-mono text-base font-bold disabled:opacity-40"
              />
            </div>

            {/* Checkbox Sem Limite */}
            <label className="flex items-center gap-2 p-3 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isUnlimited}
                onChange={(e) => setIsUnlimited(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="font-bold text-[var(--text-primary)]">
                Sem Limite Diário (Consumo livre até zerar saldo)
              </span>
            </label>

            <div className="pt-2 flex items-center justify-between border-t border-[var(--border-color)]">
              <button
                onClick={() => setLimitModalStudent(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold uppercase"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveDailyLimit}
                disabled={isPending}
                className="px-6 py-2.5 bg-[#1A6B2E] hover:bg-[#0D4A1C] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Salvar Limite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
