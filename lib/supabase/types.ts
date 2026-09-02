export interface CanteenProduct {
  id: string
  name: string
  category: 'cervejas' | 'sem_alcool' | 'lanches' | 'snacks_acai'
  cost_price: number
  sale_price: number
  current_stock: number
  min_stock: number
  image_emoji: string
  is_active: boolean
  created_at: string
}

export interface CanteenTab {
  id: string
  tab_number: number
  client_name: string
  tab_type: 'pelada' | 'aluno_escolinha' | 'balcao'
  court_or_class: string | null
  student_id: string | null
  status: 'open' | 'closed' | 'cancelled'
  total_amount: number
  created_at: string
  closed_at: string | null
  items?: CanteenTabItem[]
  student?: {
    id: string
    name: string
    preferred_position: string
  }
}

export interface CanteenTabItem {
  id: string
  tab_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  added_at: string
}

export interface CanteenSale {
  id: string
  tab_id: string | null
  client_name: string | null
  total_amount: number
  payment_method: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'prepaid_wallet'
  items_summary: string | null
  created_at: string
}

export interface StudentWallet {
  id: string
  student_id: string
  balance: number
  updated_at: string
  student?: {
    id: string
    name: string
    uniform_size: string
    guardian?: {
      name: string
      phone: string
    }[]
  }
}

export interface WalletTransaction {
  id: string
  student_id: string
  type: 'deposit' | 'purchase'
  amount: number
  description: string
  created_at: string
}
