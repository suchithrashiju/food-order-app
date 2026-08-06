import { Link, useNavigate } from 'react-router'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/features/cart/context/cart-context'
import { formatCurrency } from '@/lib/utils'

export function CartPage() {
  const navigate = useNavigate()
  const { items, subtotal, deliveryFee, tax, total, increment, decrement, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <EmptyState
          title="Your cart is empty"
          description="Browse the menu and add something delicious."
          actionLabel="Browse Menu"
          onAction={() => navigate('/menu')}
        />
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Your bag</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cart
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {items.length} {items.length === 1 ? 'item' : 'items'} ready for checkout
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/menu">Add more</Link>
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-3">
          {items.map((entry) => (
            <article
              key={entry.menuItem.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"
            >
              <div className="h-24 w-full overflow-hidden rounded-xl bg-slate-100 sm:h-20 sm:w-20 dark:bg-slate-800">
                {entry.menuItem.imageUrl ? (
                  <img
                    src={entry.menuItem.imageUrl}
                    alt={entry.menuItem.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <ShoppingBag className="h-6 w-6" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="truncate font-semibold text-slate-900 dark:text-white">
                  {entry.menuItem.name}
                </h2>
                <p className="text-sm text-slate-500">{entry.menuItem.category}</p>
                <p className="text-sm font-semibold text-primary">
                  {formatCurrency(entry.menuItem.price)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    aria-label={`Decrease ${entry.menuItem.name}`}
                    onClick={() => decrement(entry.menuItem.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                    {entry.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    aria-label={`Increase ${entry.menuItem.name}`}
                    onClick={() => increment(entry.menuItem.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <p className="min-w-[4.5rem] text-right text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(entry.menuItem.price * entry.quantity)}
                </p>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${entry.menuItem.name}`}
                  onClick={() => removeItem(entry.menuItem.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24 dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order summary</h2>
          </div>
          <div className="space-y-3 px-5 py-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery fee</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
              <span>Grand total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <Button asChild className="mt-2 w-full" size="lg">
              <Link to="/checkout">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}
