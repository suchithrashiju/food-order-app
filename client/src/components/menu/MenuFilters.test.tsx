import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MenuFilters } from '@/components/menu/MenuFilters'

describe('MenuFilters', () => {
  it('renders All plus provided categories and notifies on selection', async () => {
    const user = userEvent.setup()
    const onSelectCategory = vi.fn()

    render(
      <MenuFilters
        categories={['Burgers', 'Pizza']}
        selectedCategory="All"
        onSelectCategory={onSelectCategory}
      />,
    )

    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Burgers' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pizza' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Pizza' }))

    expect(onSelectCategory).toHaveBeenCalledWith('Pizza')
  })
})
