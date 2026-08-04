import { CheckCircle2 } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { orderService } from '@/services/order.service'

export function OrderSuccessPage() {
  const { orderId = '' } = useParams()

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: Boolean(orderId),
  })

  return (
    <Card className="mx-auto max-w-xl overflow-hidden">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="animate-bounce">
          <CheckCircle2 className="h-16 w-16 text-accent" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Order placed!</h1>
        <p className="text-slate-500">Thanks for ordering with FoodOrder.</p>
        <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium dark:bg-slate-800">
          Order ID: <span className="font-mono">{orderId}</span>
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Estimated delivery:{' '}
          <strong>{orderQuery.data?.estimatedDeliveryMinutes ?? 35} minutes</strong>
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to={`/track/${orderId}`}>Track Order</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/menu">Continue Shopping</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
