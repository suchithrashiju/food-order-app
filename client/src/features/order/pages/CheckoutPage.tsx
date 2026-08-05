import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/features/cart/context/cart-context'
import { getErrorMessage } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
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
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Delivery details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            {(
              [
                ['name', 'Full name', 'text'],
                ['phone', 'Phone number', 'tel'],
                ['email', 'Email (optional)', 'email'],
                ['address', 'Street address', 'text'],
                ['city', 'City', 'text'],
                ['postalCode', 'Postal code', 'text'],
              ] as const
            ).map(([name, label, type]) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} type={type} {...form.register(name)} aria-invalid={!!form.formState.errors[name]} />
                {form.formState.errors[name] ? (
                  <p className="text-xs text-red-600" role="alert">
                    {form.formState.errors[name]?.message}
                  </p>
                ) : null}
              </div>
            ))}

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" {...form.register('notes')} />
            </div>

            {placeOrder.isError ? (
              <p className="text-sm text-red-600" role="alert">
                {getErrorMessage(placeOrder.error)}
              </p>
            ) : null}

            <Button type="submit" className="w-full" size="lg" loading={placeOrder.isPending}>
              Place Order
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {items.map((entry) => (
            <div key={entry.menuItem.id} className="flex justify-between gap-3">
              <span>
                {entry.quantity}× {entry.menuItem.name}
              </span>
              <span>{formatCurrency(entry.menuItem.price * entry.quantity)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
