import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { CartProvider } from '@/features/cart/context/cart-context'
import { CartPage } from '@/features/cart/pages/CartPage'
import type { CartItem, MenuItem } from '@/types'

const pizza: MenuItem = {
  id: 'pizza-1',
  name: 'Margherita Pizza',
  description: 'Tomato, mozzarella, basil',
  price: 15,
  category: 'Pizza',
  isAvailable: true,
  rating: 4.8,
  preparationTime: 25,
}

function seedCart(quantity = 1) {
  const items: CartItem[] = [{ menuItem: pizza, quantity }]
  localStorage.setItem('foodorder_cart_v1', JSON.stringify(items))
}

describe('CartPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows empty state when cart has no items', () => {
    render(
      <MemoryRouter>
        <CartProvider>
          <CartPage />
        </CartProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
  })

  it('updates quantity with increment and decrement controls', async () => {
    const user = userEvent.setup()
    seedCart(1)

    render(
      <MemoryRouter>
        <CartProvider>
          <CartPage />
        </CartProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Increase Margherita Pizza' }))
    expect(screen.getByText('2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Decrease Margherita Pizza' }))
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
