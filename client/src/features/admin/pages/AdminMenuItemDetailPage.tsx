import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Tag, UtensilsCrossed } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { adminService } from '@/services/admin.service'

export function AdminMenuItemDetailPage() {
  const { itemId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const itemQuery = useQuery({
    queryKey: ['admin-menu-item', itemId],
    queryFn: () => adminService.getMenuItemById(itemId),
    enabled: Boolean(itemId),
    retry: false,
  })

  const statusMutation = useMutation({
    mutationFn: (isAvailable: boolean) => adminService.changeMenuItemStatus(itemId, isAvailable),
    onSuccess: async (_data, isAvailable) => {
      toast.success(isAvailable ? 'Marked available' : 'Marked unavailable')
      await queryClient.invalidateQueries({ queryKey: ['admin-menu-item', itemId] })
      await queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => adminService.deleteMenuItem(itemId),
    onSuccess: async () => {
      toast.success('Menu item deleted')
      await queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] })
      navigate('/admin/menu-items', { replace: true })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  if (itemQuery.isLoading) {
    return <p className="text-slate-500">Loading menu item…</p>
  }

  if (itemQuery.isError || !itemQuery.data) {
    return (
      <EmptyState
        title="Menu item not found"
        description={getErrorMessage(itemQuery.error)}
        actionLabel="Back to menu items"
        onAction={() => navigate('/admin/menu-items')}
      />
    )
  }

  const item = itemQuery.data

  function handleDelete() {
    const confirmed = window.confirm(`Delete "${item.name}"? This cannot be undone.`)
    if (!confirmed) return
    deleteMutation.mutate()
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/menu-items">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to menu items
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="mt-1 text-slate-500">Menu item details</p>
          </div>
        </div>
        <Badge variant={item.isAvailable ? 'success' : 'muted'}>
          {item.isAvailable ? 'Available' : 'Unavailable'}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              Item information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-48 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                No image
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Description
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-300">{item.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Category
                </p>
                <p className="mt-1 flex items-center gap-1 font-medium">
                  <Tag className="h-4 w-4 text-slate-400" />
                  {item.category}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Price
                </p>
                <p className="mt-1 text-lg font-bold text-primary">{formatCurrency(item.price)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate(!item.isAvailable)}
            >
              {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() =>
                navigate('/admin/menu-items', { state: { editItemId: item.id } })
              }
            >
              Edit item
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Delete item
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
