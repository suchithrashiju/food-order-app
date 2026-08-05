import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CartProvider } from '@/features/cart/context/cart-context'
import { MenuCard } from '@/features/menu/components/MenuCard'
import type { MenuItem } from '@/types'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const burger: MenuItem = {
  id: 'burger-1',
  name: 'Classic Burger',
  description: 'Juicy grilled burger with cheese',
  price: 12.5,
  category: 'Burgers',
  imageUrl: 'https://example.com/burger.jpg',
  isAvailable: true,
  rating: 4.5,
  preparationTime: 20,
}

describe('MenuCard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders menu item details and adds to cart', async () => {
    const user = userEvent.setup()

    render(
      <CartProvider>
        <MenuCard item={burger} />
      </CartProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Classic Burger' })).toBeInTheDocument()
    expect(screen.getByText(/Juicy grilled burger/i)).toBeInTheDocument()
    expect(screen.getByText('₹12.50')).toBeInTheDocument()
    expect(screen.getByAltText('Classic Burger')).toHaveAttribute(
      'src',
      'https://example.com/burger.jpg',
    )

    await user.click(screen.getByRole('button', { name: 'Add Classic Burger to cart' }))

    const stored = JSON.parse(localStorage.getItem('foodorder_cart_v1') ?? '[]') as Array<{
      menuItem: MenuItem
      quantity: number
    }>
    expect(stored).toHaveLength(1)
    expect(stored[0]?.menuItem.id).toBe('burger-1')
    expect(stored[0]?.quantity).toBe(1)
  })

  it('disables add to cart when item is unavailable', () => {
    render(
      <CartProvider>
        <MenuCard item={{ ...burger, isAvailable: false }} />
      </CartProvider>,
    )

    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Classic Burger to cart' })).toBeDisabled()
  })
})
