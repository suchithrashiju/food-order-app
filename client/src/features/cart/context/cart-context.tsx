/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'

import type { CartItem, MenuItem } from '@/types'

const DELIVERY_FEE = 2.99
const TAX_RATE = 0.08
const STORAGE_KEY = 'foodorder_cart_v1'

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD'; payload: MenuItem }
  | { type: 'REMOVE'; payload: string }
  | { type: 'INCREMENT'; payload: string }
  | { type: 'DECREMENT'; payload: string }
  | { type: 'CLEAR' }

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  addItem: (item: MenuItem) => void
  removeItem: (menuItemId: string) => void
  increment: (menuItemId: string) => void
  decrement: (menuItemId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((entry) => entry.menuItem.id === action.payload.id)
      if (existing) {
        return {
          items: state.items.map((entry) =>
            entry.menuItem.id === action.payload.id
              ? { ...entry, quantity: Math.min(entry.quantity + 1, 50) }
              : entry,
          ),
        }
      }
      return { items: [...state.items, { menuItem: action.payload, quantity: 1 }] }
    }
    case 'REMOVE':
      return { items: state.items.filter((entry) => entry.menuItem.id !== action.payload) }
    case 'INCREMENT':
      return {
        items: state.items.map((entry) =>
          entry.menuItem.id === action.payload
            ? { ...entry, quantity: Math.min(entry.quantity + 1, 50) }
            : entry,
        ),
      }
    case 'DECREMENT':
      return {
        items: state.items
          .map((entry) =>
            entry.menuItem.id === action.payload
              ? { ...entry, quantity: entry.quantity - 1 }
              : entry,
          )
          .filter((entry) => entry.quantity > 0),
      }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, () => ({
    items: typeof window === 'undefined' ? [] : readStoredCart(),
  }))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  const addItem = useCallback((item: MenuItem) => {
    dispatch({ type: 'ADD', payload: item })
  }, [])

  const removeItem = useCallback((menuItemId: string) => {
    dispatch({ type: 'REMOVE', payload: menuItemId })
  }, [])

  const increment = useCallback((menuItemId: string) => {
    dispatch({ type: 'INCREMENT', payload: menuItemId })
  }, [])

  const decrement = useCallback((menuItemId: string) => {
    dispatch({ type: 'DECREMENT', payload: menuItemId })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const totals = useMemo(() => {
    const subtotal = state.items.reduce(
      (sum, entry) => sum + entry.menuItem.price * entry.quantity,
      0,
    )
    const tax = Number((subtotal * TAX_RATE).toFixed(2))
    const deliveryFee = state.items.length > 0 ? DELIVERY_FEE : 0
    const total = Number((subtotal + tax + deliveryFee).toFixed(2))
    const itemCount = state.items.reduce((sum, entry) => sum + entry.quantity, 0)
    return { subtotal, tax, deliveryFee, total, itemCount }
  }, [state.items])

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      ...totals,
      addItem,
      removeItem,
      increment,
      decrement,
      clearCart,
    }),
    [state.items, totals, addItem, removeItem, increment, decrement, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
