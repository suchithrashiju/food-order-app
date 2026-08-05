import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ClipboardList, Package, ShoppingBag, UtensilsCrossed } from 'lucide-react'
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

  const menuQuery = useQuery({
    queryKey: ['admin-menu-items'],
    queryFn: () => adminService.listMenuItems(),
    retry: false,
  })

  if (statsQuery.isLoading || menuQuery.isLoading) {
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
  const menuCount = menuQuery.data?.length ?? 0
  const availableMenuCount = menuQuery.data?.filter((item) => item.isAvailable).length ?? 0
  const todaysOrders = stats.todaysOrders ?? 0
  const cancelledOrders = stats.cancelledOrders ?? 0

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500">Quick overview of menu, orders, and daily performance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: 'Menu Items',
            value: String(menuCount),
            hint: `${availableMenuCount} available`,
            to: '/admin/menu-items',
          },
          {
            label: 'Total Orders',
            value: String(stats.totalOrders),
            hint: `${stats.completedOrders} completed`,
            to: '/admin/orders',
          },
          {
            label: 'Pending Orders',
            value: String(stats.pendingOrders),
            hint: 'Needs attention',
            to: '/admin/orders',
          },
          {
            label: 'Cancelled Orders',
            value: String(cancelledOrders),
            hint: 'Excluded from revenue',
            to: '/admin/orders',
          },
          {
            label: "Today's Revenue",
            value: formatCurrency(stats.todaysRevenue),
            hint: `${todaysOrders} billable order${todaysOrders === 1 ? '' : 's'} today`,
            to: '/admin/orders',
          },
        ].map((card) => (
          <Link key={card.label} to={card.to} className="block transition hover:opacity-90">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Orders today</span>
              <span className="font-semibold">{todaysOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Daily total</span>
              <span className="font-semibold text-primary">{formatCurrency(stats.todaysRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Pending</span>
              <span className="font-semibold">{stats.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Completed</span>
              <span className="font-semibold">{stats.completedOrders}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-slate-500">Cancelled</span>
              <span className="font-semibold text-red-600">{cancelledOrders}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Quick navigation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[
              {
                to: '/admin/orders',
                label: 'Manage Orders',
                description: 'View and update order status',
                icon: ShoppingBag,
              },
              {
                to: '/admin/menu-items',
                label: 'Menu Items',
                description: 'Add or edit food items',
                icon: UtensilsCrossed,
              },
              {
                to: '/admin/orders',
                label: 'Pending Queue',
                description: `${stats.pendingOrders} order(s) waiting`,
                icon: ClipboardList,
              },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 transition hover:border-primary/40 hover:bg-primary/5 dark:border-slate-700"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Recent orders</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/orders">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
              <tr>
                <th className="px-2 py-3 font-medium">Sl No</th>
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
                  <td colSpan={6} className="px-2 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-slate-300" />
                      No orders yet.
                    </div>
                  </td>
                </tr>
              ) : (
                stats.recentOrders.slice(0, 5).map((order, index) => (
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
