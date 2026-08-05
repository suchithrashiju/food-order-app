import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { adminService } from '@/services/admin.service'

export function AdminOrdersPage() {
  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminService.listOrders(),
    retry: false,
  })

  if (ordersQuery.isLoading) {
    return <p className="text-slate-500">Loading orders…</p>
  }

  if (ordersQuery.isError) {
    return (
      <EmptyState
        title="Unable to load orders"
        description={getErrorMessage(ordersQuery.error)}
        actionLabel="Retry"
        onAction={() => void ordersQuery.refetch()}
      />
    )
  }

  const orders = ordersQuery.data ?? []
  const pendingCount = orders.filter(
    (order) => order.status !== 'Delivered' && order.status !== 'Cancelled',
  ).length

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-slate-500">
          {orders.length} total · {pendingCount} pending — click View to update status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All orders</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
              <tr>
                <th className="px-2 py-3 font-medium">Sl No</th>
                <th className="px-2 py-3 font-medium">Order Ref</th>
                <th className="px-2 py-3 font-medium">Customer</th>
                <th className="px-2 py-3 font-medium">Status</th>
                <th className="px-2 py-3 font-medium">Total</th>
                <th className="px-2 py-3 font-medium">Created</th>
                <th className="px-2 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-slate-500">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-2 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-2 py-3 font-mono text-xs">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="text-primary hover:underline"
                      >
                        {order.orderReference}
                      </Link>
                    </td>
                    <td className="px-2 py-3">{order.delivery.name}</td>
                    <td className="px-2 py-3">{order.status}</td>
                    <td className="px-2 py-3">{formatCurrency(order.total)}</td>
                    <td className="px-2 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-2 py-3">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/admin/orders/${order.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  )
}
