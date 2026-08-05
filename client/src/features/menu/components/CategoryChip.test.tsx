import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CategoryChip } from '@/features/menu/components/CategoryChip'
import { formatCurrency } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats INR amounts with the rupee symbol', () => {
    expect(formatCurrency(12.5)).toBe('₹12.50')
  })
})

describe('CategoryChip', () => {
  it('notifies when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<CategoryChip label="Pizza" active onClick={onClick} />)

    await user.click(screen.getByRole('button', { name: 'Pizza' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Pizza' })).toHaveAttribute('aria-pressed', 'true')
  })
})
