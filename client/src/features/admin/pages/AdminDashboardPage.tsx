import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { adminService } from '@/services/admin.service'

export function AdminDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getDashboardStats(),
    retry: false,
  })

  if (statsQuery.isLoading) {
    return <p className="text-slate-500">Loading dashboard…</p>
  }

  if (statsQuery.isError) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={getErrorMessage(statsQuery.error)}
        actionLabel="Retry"
        onAction={() => void statsQuery.refetch()}
      />
    )
  }

  const stats = statsQuery.data!

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-slate-500">Orders overview and quick actions.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/menu-items">Manage Menu</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Orders', String(stats.totalOrders)],
          ["Today's Revenue", formatCurrency(stats.todaysRevenue)],
          ['Pending Orders', String(stats.pendingOrders)],
          ['Completed Orders', String(stats.completedOrders)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
              <tr>
                <th className="px-2 py-3 font-medium">Order Ref</th>
                <th className="px-2 py-3 font-medium">Customer</th>
                <th className="px-2 py-3 font-medium">Status</th>
                <th className="px-2 py-3 font-medium">Total</th>
                <th className="px-2 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-8 text-center text-slate-500">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-2 py-3 font-mono text-xs">{order.orderReference}</td>
                    <td className="px-2 py-3">{order.delivery.name}</td>
                    <td className="px-2 py-3">{order.status}</td>
                    <td className="px-2 py-3">{formatCurrency(order.total)}</td>
                    <td className="px-2 py-3">{new Date(order.createdAt).toLocaleString()}</td>
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
