import { Package, PlusCircle } from 'lucide-react'
import { getAllProducts } from './actions'
import { createProductAction } from '../actions'
import { ProdutosClient } from './produtos-client'

export default async function ProdutosPage() {
  const products = await getAllProducts()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bebas text-3xl sm:text-4xl tracking-wider leading-none flex items-center gap-2.5 text-[var(--text-primary)]">
            <Package className="w-8 h-8 text-[#1A6B2E] dark:text-emerald-400" />
            Cardápio & Estoque da Cantina
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de produtos, margem de lucro, entrada de mercadorias e alerta de reposição.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Produtos */}
        <div className="lg:col-span-8 space-y-4">
          <ProdutosClient products={products} />
        </div>

        {/* Formulário: Cadastrar Novo Produto */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-app p-6 space-y-4">
            <div className="border-b border-[var(--border-color)] pb-3">
              <h3 className="font-bebas text-2xl text-[var(--text-primary)] tracking-wider leading-none flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#1A6B2E] dark:text-emerald-400" />
                Cadastrar Item
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Adicione novo produto ao cardápio</p>
            </div>

            <form action={createProductAction} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nome do Item <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ex: Cerveja Corona 330ml ou Pastel de Queijo"
                  className="input-app"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Categoria
                  </label>
                  <select name="category" className="input-app cursor-pointer">
                    <option value="cervejas">🍺 Cervejas</option>
                    <option value="sem_alcool">🥤 Sem Álcool</option>
                    <option value="lanches">🍢 Lanches</option>
                    <option value="snacks_acai">🍧 Açaí & Doces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Ícone Emoji
                  </label>
                  <select name="image_emoji" className="input-app cursor-pointer">
                    <option value="🍺">🍺 Cerveja</option>
                    <option value="🍻">🍻 Chopp</option>
                    <option value="⚡">⚡ Isotônico / Gatorade</option>
                    <option value="💧">💧 Água</option>
                    <option value="🥤">🥤 Refrigerante</option>
                    <option value="🍢">🍢 Espetinho</option>
                    <option value="🥪">🥪 Sanduíche</option>
                    <option value="🍗">🍗 Salgado / Coxinha</option>
                    <option value="🍟">🍟 Batata Frita</option>
                    <option value="🍧">🍧 Açaí</option>
                    <option value="🍫">🍫 Chocolate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    name="cost_price"
                    step="0.10"
                    defaultValue="5.00"
                    className="input-app font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Preço de Venda (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="sale_price"
                    step="0.10"
                    defaultValue="10.00"
                    required
                    className="input-app font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    name="current_stock"
                    defaultValue="24"
                    className="input-app font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    defaultValue="10"
                    className="input-app font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1A6B2E] hover:bg-[#0D4A1C] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer"
              >
                Salvar Produto
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
