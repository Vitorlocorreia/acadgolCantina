import { Wallet } from 'lucide-react'
import { getStudentsWalletsList } from './actions'
import { CarteiraClient } from './carteira-client'

export default async function CarteiraAlunosPage() {
  const { students, transactions } = await getStudentsWalletsList()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bebas text-3xl sm:text-4xl tracking-wider leading-none flex items-center gap-2.5 text-[var(--text-primary)]">
            <Wallet className="w-8 h-8 text-purple-600" />
            Carteira Digital dos Alunos da Escolinha
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão de saldo pré-pago dos atletas para consumo de lanches e bebidas pós-treino.
          </p>
        </div>
      </div>

      <CarteiraClient students={students} transactions={transactions} />
    </div>
  )
}
