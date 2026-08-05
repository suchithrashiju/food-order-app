import { Link, useNavigate } from 'react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/features/cart/context/cart-context'
import { formatCurrency } from '@/lib/utils'

export function CartPage() {
  const navigate = useNavigate()
  const { items, subtotal, deliveryFee, tax, total, increment, decrement, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse the menu and add something delicious."
        actionLabel="Browse Menu"
        onAction={() => navigate('/menu')}
      />
    )
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Cart</h1>
        {items.map((entry) => (
          <Card key={entry.menuItem.id}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
                {entry.menuItem.imageUrl ? (
                  <img
                    src={entry.menuItem.imageUrl}
                    alt={entry.menuItem.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="font-semibold">{entry.menuItem.name}</h2>
                <p className="text-sm text-slate-500">{formatCurrency(entry.menuItem.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Decrease ${entry.menuItem.name}`}
                  onClick={() => decrement(entry.menuItem.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold" aria-live="polite">
                  {entry.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Increase ${entry.menuItem.name}`}
                  onClick={() => increment(entry.menuItem.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${entry.menuItem.name}`}
                  onClick={() => removeItem(entry.menuItem.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery fee</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Grand total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <Button asChild className="mt-2 w-full" size="lg">
            <Link to="/checkout">Proceed to Checkout</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
