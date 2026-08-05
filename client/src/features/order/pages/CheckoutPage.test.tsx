import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CartProvider } from '@/features/cart/context/cart-context'
import { CheckoutPage } from '@/features/order/pages/CheckoutPage'
import type { CartItem, MenuItem } from '@/types'

vi.mock('@/services/order.service', () => ({
  orderService: {
    createOrder: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const wrap: MenuItem = {
  id: 'wrap-1',
  name: 'Chicken Wrap',
  description: 'Grilled chicken wrap',
  price: 9.5,
  category: 'Wraps',
  isAvailable: true,
  rating: 4.2,
  preparationTime: 15,
}

function renderCheckout() {
  const items: CartItem[] = [{ menuItem: wrap, quantity: 1 }]
  localStorage.setItem('foodorder_cart_v1', JSON.stringify(items))

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CartProvider>
          <CheckoutPage />
        </CartProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows validation errors when required delivery fields are empty', async () => {
    const user = userEvent.setup()
    renderCheckout()

    expect(screen.getByText('Delivery details')).toBeInTheDocument()
    expect(screen.getByText(/1× Chicken Wrap/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Place Order' }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Phone is required')).toBeInTheDocument()
    expect(screen.getByText('Address is required')).toBeInTheDocument()
    expect(screen.getByText('City is required')).toBeInTheDocument()
    expect(screen.getByText('Postal code is required')).toBeInTheDocument()
  })
})
