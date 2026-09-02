'use client'

import { useState, useTransition } from 'react'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  CreditCard,
  Banknote,
  ClipboardList,
  Wallet,
  Loader2,
  Search,
  Beer,
  Zap,
  Coffee,
  Sparkles,
  Check,
} from 'lucide-react'
import {
  processDirectSaleAction,
  addToTabAction,
  chargeStudentWalletAction,
  createTabAction,
} from './actions'

interface CartItem {
  productId: string
  name: string
  unitPrice: number
  quantity: number
  imageEmoji: string
}

interface Props {
  products: any[]
  openTabs: any[]
  students: any[]
}

function fmt(val: number) {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const categories = [
  { id: 'all', label: 'Todos os Itens', emoji: '🌟' },
  { id: 'cervejas', label: 'Cervejas & Chopp', emoji: '🍺' },
  { id: 'sem_alcool', label: 'Gatorade & Sem Álcool', emoji: '🥤' },
  { id: 'lanches', label: 'Espetinhos & Lanches', emoji: '🍢' },
  { id: 'snacks_acai', label: 'Açaí & Doces', emoji: '🍧' },
]

export function PdvClient({ products, openTabs, students }: Props) {
  const [isPending, startTransition] = useTransition()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal states
  const [checkoutMode, setCheckoutMode] = useState<'none' | 'balcao' | 'comanda' | 'aluno'>('none')
  const [selectedTabId, setSelectedTabId] = useState<string>(openTabs[0]?.id || '')
  const [newTabName, setNewTabName] = useState('')
  const [newTabCourt, setNewTabCourt] = useState('Campo 01 - 20:00')
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '')
  const [studentSearch, setStudentSearch] = useState('')

  // Add to cart
  const addToCart = (prod: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === prod.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          unitPrice: prod.sale_price,
          quantity: 1,
          imageEmoji: prod.image_emoji || '🍺',
        },
      ]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId === productId) {
            const next = i.quantity + delta
            return next > 0 ? { ...i, quantity: next } : null
          }
          return i
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const cartTotal = cart.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
  const cartItemCount = cart.reduce((acc, i) => acc + i.quantity, 0)

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Finalizar Venda Balcão
  const handleFinalizeBalcao = (paymentMethod: string) => {
    if (cart.length === 0) return
    setFeedback(null)
    startTransition(async () => {
      const res = await processDirectSaleAction(cart, paymentMethod, 'Venda Rápida Balcão')
      if (res.success) {
        setFeedback({ type: 'success', message: `Venda de ${fmt(cartTotal)} finalizada com sucesso via ${paymentMethod.toUpperCase()}!` })
        setCart([])
        setCheckoutMode('none')
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao processar venda.' })
      }
    })
  }

  // Finalizar Lançamento em Comanda
  const handleFinalizeComanda = async () => {
    if (cart.length === 0) return
    setFeedback(null)

    startTransition(async () => {
      let targetTabId = selectedTabId

      // Se o usuário digitou nome para nova comanda
      if (newTabName.trim()) {
        const createRes = await createTabAction(newTabName.trim(), 'pelada', newTabCourt)
        if (createRes.success && createRes.tab) {
          targetTabId = createRes.tab.id
        }
      }

      if (!targetTabId) {
        setFeedback({ type: 'error', message: 'Selecione ou crie uma comanda.' })
        return
      }

      const res = await addToTabAction(targetTabId, cart)
      if (res.success) {
        setFeedback({ type: 'success', message: `Itens adicionados à comanda da pelada com sucesso!` })
        setCart([])
        setCheckoutMode('none')
        setNewTabName('')
      } else {
        setFeedback({ type: 'error', message: 'Erro ao lançar na comanda.' })
      }
    })
  }

  // Finalizar Débito no Saldo do Aluno
  const handleFinalizeAluno = () => {
    if (cart.length === 0 || !selectedStudentId) return
    setFeedback(null)
    startTransition(async () => {
      const res = await chargeStudentWalletAction(selectedStudentId, cart, cartTotal)
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Lanche debitado com sucesso da carteira do atleta! Saldo restante: ${fmt(res.remainingBalance || 0)}`,
        })
        setCart([])
        setCheckoutMode('none')
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao debitar carteira.' })
      }
    })
  }

  // Alunos filtrados
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  )
  const currentSelectedStudent = students.find((s) => s.id === selectedStudentId)
  const studentWalletBalance = Array.isArray(currentSelectedStudent?.wallet)
    ? currentSelectedStudent?.wallet[0]?.balance ?? 0
    : currentSelectedStudent?.wallet?.balance ?? 0

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-[6px] text-xs font-bold flex items-center justify-between gap-3 border shadow-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-[#C8E6C9]/60 border-[#1A6B2E]/30 text-[#0D4A1C] dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#1A6B2E] dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Grid Principal: Produtos (Esquerda) + Cupom / Carrinho (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Catálogo de Produtos (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Categorias em Pílulas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#1A6B2E] text-white border-[#1A6B2E] shadow-xs dark:bg-emerald-600 dark:border-emerald-600'
                      : 'bg-[var(--bg-card)] text-slate-600 dark:text-slate-400 border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>

          {/* Barra de Busca de Produto */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por cerveja, espetinho, refrigerante, gatorade, açaí..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-app pl-10"
            />
          </div>

          {/* Grid de Itens com Toque Rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => {
              const isOut = prod.current_stock <= 0
              const isLow = prod.current_stock <= prod.min_stock

              return (
                <button
                  key={prod.id}
                  onClick={() => !isOut && addToCart(prod)}
                  disabled={isOut}
                  className={`card-app p-3 text-left flex flex-col justify-between space-y-2 hover:border-[#1A6B2E] dark:hover:border-emerald-500 transition-all cursor-pointer group active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-2xl">{prod.image_emoji || '🍺'}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isOut
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
                          : isLow
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-slate-300'
                      }`}
                    >
                      {prod.current_stock} un
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-[#1A6B2E] dark:group-hover:text-emerald-400">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]">
                    <span className="font-bebas text-lg text-[#1A6B2E] dark:text-emerald-400 leading-none">
                      {fmt(prod.sale_price)}
                    </span>
                    <div className="w-6 h-6 rounded bg-[#1A6B2E]/10 group-hover:bg-[#1A6B2E] group-hover:text-white text-[#1A6B2E] dark:text-emerald-400 dark:group-hover:bg-emerald-600 flex items-center justify-center transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Lado Direito: Cupom / Carrinho da Venda (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="card-app p-5 space-y-4 sticky top-20 shadow-md">
            {/* Header do Carrinho */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#1A6B2E] dark:text-emerald-400" />
                <h2 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                  Comanda Atual
                </h2>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar
                </button>
              )}
            </div>

            {/* Lista de Itens no Cupom */}
            {cart.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-700" />
                <p className="text-xs font-bold text-slate-500">Nenhum item selecionado</p>
                <p className="text-[11px] text-slate-400">Toque nos produtos ao lado para adicionar ao pedido.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[var(--text-primary)] truncate flex items-center gap-1">
                        <span>{item.imageEmoji}</span>
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {fmt(item.unitPrice)} un
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="font-mono font-bold text-[#1A6B2E] dark:text-emerald-400 text-right w-16 shrink-0">
                      {fmt(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totalizador */}
            <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Quantidade Total</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {cartItemCount} item(s)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bebas text-xl text-[var(--text-primary)] tracking-wider">
                  TOTAL A PAGAR
                </span>
                <span className="font-bebas text-3xl text-[#1A6B2E] dark:text-emerald-400 leading-none">
                  {fmt(cartTotal)}
                </span>
              </div>
            </div>

            {/* 3 Botões de Finalização do PDV */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setCheckoutMode('balcao')}
                disabled={cart.length === 0 || isPending}
                className="w-full py-3 bg-[#1A6B2E] hover:bg-[#0D4A1C] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-[6px] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-40"
              >
                <QrCode className="w-4 h-4" />
                Venda Balcão (PIX / Cartão / Dinheiro)
              </button>

              <button
                onClick={() => setCheckoutMode('comanda')}
                disabled={cart.length === 0 || isPending}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-[6px] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-40"
              >
                <ClipboardList className="w-4 h-4" />
                Lançar na Comanda da Pelada
              </button>

              <button
                onClick={() => setCheckoutMode('aluno')}
                disabled={cart.length === 0 || isPending}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-[6px] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-40"
              >
                <Wallet className="w-4 h-4" />
                Debitar do Saldo do Aluno (Escolinha)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: CHECKOUT BALCÃO (PIX, CARTÃO, DINHEIRO) */}
      {checkoutMode === 'balcao' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-app bg-[var(--bg-card)] max-w-md w-full p-6 space-y-5 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                  Finalizar Venda Balcão
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Total: {fmt(cartTotal)}</p>
              </div>
              <button
                onClick={() => setCheckoutMode('none')}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleFinalizeBalcao('pix')}
                disabled={isPending}
                className="p-3.5 rounded-[6px] border border-[#1A6B2E]/30 bg-[#C8E6C9]/20 hover:bg-[#C8E6C9]/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 flex items-center justify-between text-xs font-bold text-[#0D4A1C] dark:text-emerald-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <QrCode className="w-5 h-5 text-[#1A6B2E] dark:text-emerald-400" />
                  <span>PIX Instantâneo (QR Code)</span>
                </div>
                <span className="font-bebas text-xl">{fmt(cartTotal)}</span>
              </button>

              <button
                onClick={() => handleFinalizeBalcao('credit_card')}
                disabled={isPending}
                className="p-3.5 rounded-[6px] border border-blue-200 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Cartão de Crédito</span>
                </div>
                <span className="font-bebas text-xl">{fmt(cartTotal)}</span>
              </button>

              <button
                onClick={() => handleFinalizeBalcao('debit_card')}
                disabled={isPending}
                className="p-3.5 rounded-[6px] border border-teal-200 bg-teal-50/50 hover:bg-teal-50 dark:bg-teal-950/30 dark:hover:bg-teal-950/60 flex items-center justify-between text-xs font-bold text-teal-900 dark:text-teal-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-teal-600" />
                  <span>Cartão de Débito</span>
                </div>
                <span className="font-bebas text-xl">{fmt(cartTotal)}</span>
              </button>

              <button
                onClick={() => handleFinalizeBalcao('cash')}
                disabled={isPending}
                className="p-3.5 rounded-[6px] border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span>Dinheiro em Espécie</span>
                </div>
                <span className="font-bebas text-xl">{fmt(cartTotal)}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setCheckoutMode('none')}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold uppercase"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LANÇAR NA COMANDA DA PELADA */}
      {checkoutMode === 'comanda' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-app bg-[var(--bg-card)] max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                  Lançar na Comanda da Pelada
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Adicione os itens na conta de uma quadra/grupo</p>
              </div>
              <button
                onClick={() => setCheckoutMode('none')}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Selecionar Comanda Existente */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Comandas Abertas Hoje:
              </label>
              {openTabs.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Nenhuma comanda aberta no momento.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {openTabs.map((tab) => (
                    <label
                      key={tab.id}
                      className={`p-2.5 rounded border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        selectedTabId === tab.id
                          ? 'bg-[#C8E6C9]/40 border-[#1A6B2E] dark:bg-emerald-950/40 dark:border-emerald-600'
                          : 'bg-[var(--bg-subtle)] border-[var(--border-color)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tabSelection"
                          checked={selectedTabId === tab.id}
                          onChange={() => {
                            setSelectedTabId(tab.id)
                            setNewTabName('')
                          }}
                          className="text-[#1A6B2E]"
                        />
                        <span className="font-bold text-[var(--text-primary)]">
                          #{tab.tab_number} — {tab.client_name}
                        </span>
                        <span className="text-[10px] text-slate-500">({tab.court_or_class})</span>
                      </div>
                      <span className="font-mono font-bold text-[#1A6B2E] dark:text-emerald-400">
                        {fmt(tab.total_amount)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Ou Abrir Nova Comanda */}
            <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Ou Abrir Nova Comanda para a Pelada:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nome do Grupo / Responsável"
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                  className="input-app"
                />
                <input
                  type="text"
                  placeholder="Quadra / Horário (ex: Campo 01 - 20h)"
                  value={newTabCourt}
                  onChange={(e) => setNewTabCourt(e.target.value)}
                  className="input-app"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
              <button
                onClick={() => setCheckoutMode('none')}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold uppercase"
              >
                Cancelar
              </button>

              <button
                onClick={handleFinalizeComanda}
                disabled={isPending}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirmar Lançamento ({fmt(cartTotal)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DEBITAR SALDO DO ALUNO DA ESCOLINHA */}
      {checkoutMode === 'aluno' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-app bg-[var(--bg-card)] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none">
                  Debitar da Carteira do Aluno
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Lanche pós-treino debitado do saldo pré-pago</p>
              </div>
              <button
                onClick={() => setCheckoutMode('none')}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Busca de Aluno */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Buscar atleta pelo nome..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="input-app"
              />

              <div className="max-h-44 overflow-y-auto space-y-1.5">
                {filteredStudents.map((st) => {
                  const balance = Array.isArray(st.wallet) ? st.wallet[0]?.balance ?? 0 : st.wallet?.balance ?? 0
                  const isSelected = selectedStudentId === st.id

                  return (
                    <label
                      key={st.id}
                      className={`p-2.5 rounded border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-50 border-purple-500 dark:bg-purple-950/40 dark:border-purple-500'
                          : 'bg-[var(--bg-subtle)] border-[var(--border-color)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="studentRadio"
                          checked={isSelected}
                          onChange={() => setSelectedStudentId(st.id)}
                          className="text-purple-600"
                        />
                        <span className="font-bold text-[var(--text-primary)]">{st.name}</span>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          balance >= cartTotal ? 'text-[#1A6B2E] dark:text-emerald-400' : 'text-red-500'
                        }`}
                      >
                        Saldo: {fmt(balance)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Resumo do Débito */}
            <div className="p-3 bg-[var(--bg-subtle)] rounded border border-[var(--border-color)] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Valor do Lanche:</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{fmt(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo Atual do Aluno:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {fmt(studentWalletBalance)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-color)] pt-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">Saldo Após Débito:</span>
                <span
                  className={`font-mono font-bold ${
                    studentWalletBalance - cartTotal >= 0 ? 'text-[#1A6B2E] dark:text-emerald-400' : 'text-red-600'
                  }`}
                >
                  {fmt(studentWalletBalance - cartTotal)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setCheckoutMode('none')}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold uppercase"
              >
                Cancelar
              </button>

              <button
                onClick={handleFinalizeAluno}
                disabled={isPending || studentWalletBalance < cartTotal}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirmar Débito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
