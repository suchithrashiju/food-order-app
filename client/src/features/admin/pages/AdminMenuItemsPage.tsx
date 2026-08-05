import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { adminService } from '@/services/admin.service'
import type { AdminMenuItem, AdminMenuItemPayload } from '@/types'

const EMPTY_FORM: AdminMenuItemPayload = {
  name: '',
  description: '',
  price: 0,
  category: '',
  imageUrl: '',
  isAvailable: true,
}

type FormMode = 'create' | 'edit'

export function AdminMenuItemsPage() {
  const queryClient = useQueryClient()
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AdminMenuItemPayload>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const menuQuery = useQuery({
    queryKey: ['admin-menu-items'],
    queryFn: () => adminService.listMenuItems(),
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (payload: AdminMenuItemPayload) => adminService.createMenuItem(payload),
    onSuccess: async () => {
      toast.success('Menu item created')
      closeForm()
      await queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminMenuItemPayload> }) =>
      adminService.updateMenuItem(id, payload),
    onSuccess: async () => {
      toast.success('Menu item updated')
      closeForm()
      await queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteMenuItem(id),
    onSuccess: async () => {
      toast.success('Menu item deleted')
      await queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      adminService.changeMenuItemStatus(id, isAvailable),
    onSuccess: async (_data, variables) => {
      toast.success(variables.isAvailable ? 'Marked available' : 'Marked unavailable')
      await queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] })
    },
  })

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function openCreateForm() {
    setFormMode('create')
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function openEditForm(item: AdminMenuItem) {
    setFormMode('edit')
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl ?? '',
      isAvailable: item.isAvailable,
    })
    setFormError(null)
  }

  function validateForm(): AdminMenuItemPayload | null {
    const name = form.name.trim()
    const description = form.description.trim()
    const category = form.category.trim()
    const imageUrl = form.imageUrl?.trim()

    if (name.length < 2) {
      setFormError('Name must be at least 2 characters.')
      return null
    }
    if (description.length < 5) {
      setFormError('Description must be at least 5 characters.')
      return null
    }
    if (category.length < 2) {
      setFormError('Category must be at least 2 characters.')
      return null
    }
    if (Number.isNaN(form.price) || form.price < 0) {
      setFormError('Price must be 0 or greater.')
      return null
    }

    const payload: AdminMenuItemPayload = {
      name,
      description,
      price: form.price,
      category,
      isAvailable: form.isAvailable ?? true,
    }

    if (imageUrl) {
      try {
        // Validate URL shape before sending to the API.
        // eslint-disable-next-line no-new
        new URL(imageUrl)
        payload.imageUrl = imageUrl
      } catch {
        setFormError('Image URL must be a valid URL.')
        return null
      }
    }

    setFormError(null)
    return payload
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const payload = validateForm()
    if (!payload) return

    if (formMode === 'create') {
      createMutation.mutate(payload)
      return
    }

    if (formMode === 'edit' && editingId) {
      updateMutation.mutate({ id: editingId, payload })
    }
  }

  function handleDelete(item: AdminMenuItem) {
    const confirmed = window.confirm(`Delete “${item.name}”? This cannot be undone.`)
    if (!confirmed) return
    deleteMutation.mutate(item.id)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (menuQuery.isLoading) {
    return <p className="text-slate-500">Loading menu items…</p>
  }

  if (menuQuery.isError) {
    return (
      <EmptyState
        title="Unable to load menu items"
        description={getErrorMessage(menuQuery.error)}
        actionLabel="Retry"
        onAction={() => void menuQuery.refetch()}
      />
    )
  }

  const items = menuQuery.data ?? []

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu items</h1>
          <p className="text-slate-500">Create, update, delete, and change availability.</p>
        </div>
        <Button onClick={openCreateForm}>Add item</Button>
      </div>

      {formMode ? (
        <Card>
          <CardHeader>
            <CardTitle>{formMode === 'create' ? 'Add menu item' : 'Edit menu item'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="item-description">Description</Label>
                <Textarea
                  id="item-description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-price">Price</Label>
                <Input
                  id="item-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, price: Number(e.target.value) }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-category">Category</Label>
                <Input
                  id="item-category"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="item-image">Image URL (optional)</Label>
                <Input
                  id="item-image"
                  type="url"
                  placeholder="https://"
                  value={form.imageUrl ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={form.isAvailable ?? true}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))
                  }
                />
                Available for ordering
              </label>
              {formError ? (
                <p className="text-sm text-red-600 sm:col-span-2" role="alert">
                  {formError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit" loading={isSaving}>
                  {formMode === 'create' ? 'Create item' : 'Save changes'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
              <tr>
                <th className="px-2 py-3 font-medium">Name</th>
                <th className="px-2 py-3 font-medium">Category</th>
                <th className="px-2 py-3 font-medium">Price</th>
                <th className="px-2 py-3 font-medium">Status</th>
                <th className="px-2 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-8 text-center text-slate-500">
                    No menu items yet. Add your first item.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-2 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                      <div className="line-clamp-1 text-xs text-slate-500">{item.description}</div>
                    </td>
                    <td className="px-2 py-3">{item.category}</td>
                    <td className="px-2 py-3">{formatCurrency(item.price)}</td>
                    <td className="px-2 py-3">
                      <Badge variant={item.isAvailable ? 'success' : 'muted'}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditForm(item)}
                          disabled={isSaving}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={
                            statusMutation.isPending && statusMutation.variables?.id === item.id
                          }
                          onClick={() =>
                            statusMutation.mutate({
                              id: item.id,
                              isAvailable: !item.isAvailable,
                            })
                          }
                        >
                          {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          loading={
                            deleteMutation.isPending && deleteMutation.variables === item.id
                          }
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </Button>
                      </div>
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
