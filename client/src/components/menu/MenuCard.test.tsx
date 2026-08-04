import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MenuCard } from '@/components/menu/MenuCard'
import type { MenuItem } from '@/types/menu'

const baseItem: MenuItem = {
  id: 'item-1',
  name: 'Classic Burger',
  description: 'Juicy beef burger with house sauce.',
  price: 12.5,
  category: 'Burgers',
  imageUrl: 'https://example.com/burger.jpg',
  isAvailable: true,
}

describe('MenuCard', () => {
  it('renders name, price, category, and image alt text', () => {
    render(<MenuCard item={baseItem} />)

    expect(screen.getByRole('heading', { name: 'Classic Burger' })).toBeInTheDocument()
    expect(screen.getByText('$12.50')).toBeInTheDocument()
    expect(screen.getByText('Burgers')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Classic Burger' })).toHaveAttribute(
      'src',
      'https://example.com/burger.jpg',
    )
  })

  it('shows unavailable status when the item is not available', () => {
    render(<MenuCard item={{ ...baseItem, isAvailable: false }} />)

    expect(screen.getByText('Currently unavailable')).toBeInTheDocument()
  })
})
