import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Ban, Clock, History, MapPin, Package, Receipt, RefreshCw, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { adminService } from '@/services/admin.service'
import {
  ORDER_PROGRESS_STATUSES,
  isOrderClosed,
  type OrderStatus,
} from '@/utils/order-status'

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'success' | 'warning' | 'muted' | 'danger'> = {
  'Order Received': 'muted',
  Preparing: 'warning',
  'Out for Delivery': 'default',
  Delivered: 'success',
  Cancelled: 'danger',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

type ModalMode = 'update' | 'cancel' | null

export function AdminOrderDetailPage() {
  const { orderId = '' } = useParams()
  const queryClient = useQueryClient()
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
  const [remarks, setRemarks] = useState('')

  const orderQuery = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => adminService.getOrderById(orderId),
    enabled: Boolean(orderId),
    retry: false,
  })

  const order = orderQuery.data

  const statusMutation = useMutation({
    mutationFn: ({ status, remarks: note }: { status: OrderStatus; remarks: string }) =>
      adminService.updateOrderStatus(orderId, status, note),
    onSuccess: async (updated) => {
      toast.success(
        updated.status === 'Cancelled'
          ? 'Order cancelled'
          : `Status updated to "${updated.status}"`,
      )
      closeModal()
      await queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] })
      await queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const currentStatus = (selectedStatus || order?.status) as OrderStatus | undefined
  const statusHistory = [...(order?.statusHistory ?? [])].reverse()
  const canManage = order ? !isOrderClosed(order.status) : false

  function openUpdateModal() {
    if (!order || !canManage) return
    setSelectedStatus(order.status)
    setRemarks('')
    setModalMode('update')
  }

  function openCancelModal() {
    if (!order || !canManage) return
    setSelectedStatus('Cancelled')
    setRemarks('')
    setModalMode('cancel')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedStatus('')
    setRemarks('')
  }

  function handleSubmit() {
    if (!order || !remarks.trim()) {
      toast.error(
        modalMode === 'cancel'
          ? 'Please enter a cancellation reason'
          : 'Please add remarks for this status update',
      )
      return
    }

    if (modalMode === 'cancel') {
      statusMutation.mutate({ status: 'Cancelled', remarks: remarks.trim() })
      return
    }

    if (!currentStatus || currentStatus === order.status) return
    statusMutation.mutate({ status: currentStatus, remarks: remarks.trim() })
  }

  if (orderQuery.isLoading) {
    return <p className="text-slate-500">Loading order…</p>
  }

  if (orderQuery.isError || !order) {
    return (
      <EmptyState
        title="Order not found"
        description={getErrorMessage(orderQuery.error)}
        actionLabel="Back to orders"
        onAction={() => window.history.back()}
      />
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/orders">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to orders
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
            <p className="font-mono text-sm text-primary">{order.orderReference}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
          {canManage ? (
            <>
              <Button onClick={openUpdateModal}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Update Status
              </Button>
              <Button variant="destructive" onClick={openCancelModal}>
                <Ban className="mr-1 h-4 w-4" />
                Cancel Order
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Status update history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusHistory.length === 0 ? (
            <p className="text-sm text-slate-500">No status updates yet.</p>
          ) : (
            <ol className="space-y-4">
              {statusHistory.map((entry, index) => (
                <li
                  key={`${entry.updatedAt}-${entry.status}-${index}`}
                  className="relative border-l-2 border-primary/30 pl-4"
                >
                  <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_VARIANT[entry.status as OrderStatus] ?? 'muted'}>
                      {entry.status}
                    </Badge>
                    <span className="text-xs text-slate-400">{formatDate(entry.updatedAt)}</span>
                  </div>
                  {entry.remarks ? (
                    <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
                      {entry.remarks}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-400">Updated by {entry.updatedBy}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Items Ordered
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">
                    {item.name}
                    <span className="ml-1 text-slate-400">× {item.quantity}</span>
                  </span>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery fee</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold dark:border-slate-700">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Delivery Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <span>{order.delivery.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 shrink-0 text-slate-400" />
              <span>{order.delivery.phone}</span>
            </div>
            {order.delivery.email && (
              <p>
                <span className="text-slate-400">Email: </span>
                {order.delivery.email}
              </p>
            )}
            <p>
              {order.delivery.address}, {order.delivery.city} – {order.delivery.postalCode}
            </p>
            {order.delivery.notes && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800">
                Note: {order.delivery.notes}
              </p>
            )}
            <div className="flex items-center gap-2 pt-2 text-slate-500">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Estimated delivery: {order.estimatedDeliveryMinutes} minutes</span>
            </div>
            <div className="border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
              <p>Placed: {formatDate(order.createdAt)}</p>
              <p>Last updated: {formatDate(order.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={modalMode === 'update'}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change status for {order.orderReference} and add remarks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="order-status">Status</Label>
              <select
                id="order-status"
                value={currentStatus ?? order.status}
                onChange={(event) => setSelectedStatus(event.target.value as OrderStatus)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {ORDER_PROGRESS_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-remarks">Remarks</Label>
              <Textarea
                id="order-remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Add a note about this status change (required)"
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-slate-400">{remarks.length}/500</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal} disabled={statusMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                statusMutation.isPending ||
                !currentStatus ||
                currentStatus === order.status ||
                !remarks.trim()
              }
              onClick={handleSubmit}
            >
              {statusMutation.isPending ? 'Updating…' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modalMode === 'cancel'}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Cancel {order.orderReference}. Please provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Cancellation reason</Label>
            <Textarea
              id="cancel-reason"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Why is this order being cancelled? (required)"
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-slate-400">{remarks.length}/500</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal} disabled={statusMutation.isPending}>
              Keep Order
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={statusMutation.isPending || !remarks.trim()}
              onClick={handleSubmit}
            >
              {statusMutation.isPending ? 'Cancelling…' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
