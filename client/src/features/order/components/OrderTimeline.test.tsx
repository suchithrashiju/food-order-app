import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OrderTimeline } from '@/features/order/components/OrderTimeline'

describe('OrderTimeline', () => {
  it('highlights the current progress status', () => {
    render(<OrderTimeline currentStatus="Preparing" />)

    expect(screen.getByLabelText('Order status timeline')).toBeInTheDocument()
    expect(screen.getByText('Preparing')).toBeInTheDocument()
    expect(screen.getByText('Current status')).toBeInTheDocument()
    expect(screen.getByText('Order Received')).toBeInTheDocument()
    expect(screen.getByText('Out for Delivery')).toBeInTheDocument()
    expect(screen.getByText('Delivered')).toBeInTheDocument()
  })

  it('shows cancellation reason when order is cancelled', () => {
    render(
      <OrderTimeline currentStatus="Cancelled" cancellationReason="Customer requested cancel" />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('This order has been cancelled.')
    expect(screen.getByText(/Customer requested cancel/)).toBeInTheDocument()
  })
})
