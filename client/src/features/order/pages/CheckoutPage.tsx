import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Check, Lock, MapPin, ShoppingBag, Truck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/features/cart/context/cart-context'
import { getErrorMessage } from '@/lib/api-client'
import { cn, formatCurrency } from '@/lib/utils'
import { orderService } from '@/services/order.service'
import type { Order } from '@/types'

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  phone: z
    .string()
    .trim()
    .min(8, 'Phone is required')
    .regex(/^[+0-9\s()-]+$/, 'Enter a valid phone number'),
  email: z
    .union([z.literal(''), z.string().trim().email('Enter a valid email address')])
    .optional(),
  address: z.string().trim().min(5, 'Address is required'),
  city: z.string().trim().min(2, 'City is required'),
  postalCode: z.string().trim().min(3, 'Postal code is required'),
  notes: z.string().trim().max(300).optional(),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

const steps = [
  { label: 'Cart', done: true },
  { label: 'Checkout', done: false, current: true },
  { label: 'Confirmation', done: false },
] as const

export function CheckoutPage() {
  const { items, subtotal, deliveryFee, tax, total, clearCart } = useCart()
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      postalCode: '',
      notes: '',
    },
  })

  const placeOrder = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (order) => {
      setPlacedOrder(order)
      clearCart()
    },
  })

  if (placedOrder) {
    return (
      <Navigate
        to={`/orders/${placedOrder.id}/success`}
        replace
        state={{
          order: placedOrder,
          orderReference: placedOrder.orderReference,
          emailNotification: placedOrder.emailNotification,
        }}
      />
    )
  }

  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const onSubmit = form.handleSubmit((values) => {
    const email = values.email?.trim()

    placeOrder.mutate({
      items: items.map((entry) => ({
        menuItemId: entry.menuItem.id,
        name: entry.menuItem.name,
        price: entry.menuItem.price,
        quantity: entry.quantity,
      })),
      delivery: {
        name: values.name,
        phone: values.phone,
        address: values.address,
        city: values.city,
        postalCode: values.postalCode,
        ...(email ? { email } : {}),
        ...(values.notes ? { notes: values.notes } : {}),
      },
    })
  })

  return (
    <section className="space-y-8">
      <header className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Checkout</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Place your order
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Confirm delivery details and we’ll start preparing your meal.
          </p>
        </div>

        <nav aria-label="Checkout progress" className="flex flex-wrap items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
                  'current' in step && step.current
                    ? 'border-primary bg-primary text-white'
                    : step.done
                      ? 'border-accent/30 bg-accent/10 text-accent'
                      : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900',
                )}
              >
                {'current' in step && step.current ? (
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                ) : step.done ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <span className="flex h-3.5 w-3.5 items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                )}
                {step.label}
              </span>
              {index < steps.length - 1 ? (
                <span className="hidden h-px w-6 bg-slate-200 sm:block dark:bg-slate-700" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </nav>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.85fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Delivery details</h2>
              <p className="text-sm text-slate-500">Where should we send this order?</p>
            </div>
          </div>

          <form className="space-y-5 p-5 sm:p-6" onSubmit={onSubmit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['name', 'Full name', 'text', 'Jane Doe'],
                  ['phone', 'Phone number', 'tel', '+91 98765 43210'],
                ] as const
              ).map(([name, label, type, placeholder]) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    type={type}
                    placeholder={placeholder}
                    {...form.register(name)}
                    aria-invalid={!!form.formState.errors[name]}
                  />
                  {form.formState.errors[name] ? (
                    <p className="text-xs text-red-600" role="alert">
                      {form.formState.errors[name]?.message}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com — for order updates"
                {...form.register('email')}
                aria-invalid={!!form.formState.errors.email}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-red-600" role="alert">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Street address</Label>
              <Input
                id="address"
                type="text"
                placeholder="House / flat, street, landmark"
                {...form.register('address')}
                aria-invalid={!!form.formState.errors.address}
              />
              {form.formState.errors.address ? (
                <p className="text-xs text-red-600" role="alert">
                  {form.formState.errors.address.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['city', 'City', 'text', 'Bengaluru'],
                  ['postalCode', 'Postal code', 'text', '560001'],
                ] as const
              ).map(([name, label, type, placeholder]) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    type={type}
                    placeholder={placeholder}
                    {...form.register(name)}
                    aria-invalid={!!form.formState.errors[name]}
                  />
                  {form.formState.errors[name] ? (
                    <p className="text-xs text-red-600" role="alert">
                      {form.formState.errors[name]?.message}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Delivery notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Gate code, landmark, “leave at door”…"
                {...form.register('notes')}
              />
            </div>

            {placeOrder.isError ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40" role="alert">
                {getErrorMessage(placeOrder.error)}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <Button asChild variant="outline" type="button">
                <Link to="/cart">Back to cart</Link>
              </Button>
              <Button type="submit" size="lg" loading={placeOrder.isPending} className="sm:min-w-[200px]">
                Place Order
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order summary</h2>
              <p className="text-sm text-slate-500">
                {items.length} {items.length === 1 ? 'item' : 'items'} in your bag
              </p>
            </div>

            <div className="space-y-3 px-5 py-4">
              {items.map((entry) => (
                <div key={entry.menuItem.id} className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    {entry.menuItem.imageUrl ? (
                      <img
                        src={entry.menuItem.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {entry.quantity}× {entry.menuItem.name}
                    </p>
                    <p className="text-xs text-slate-500">{entry.menuItem.category}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(entry.menuItem.price * entry.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-slate-100 px-5 py-4 text-sm dark:border-slate-800">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
            <p className="inline-flex items-center gap-2 font-medium">
              <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
              Estimated delivery 30–45 min after confirmation
            </p>
            <p className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" aria-hidden="true" />
              Your details are used only to deliver this order
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
