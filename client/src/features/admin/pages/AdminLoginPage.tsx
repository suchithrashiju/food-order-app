import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isAdminLoggedIn } from '@/lib/admin-auth'
import { getErrorMessage } from '@/lib/api-client'
import { adminService } from '@/services/admin.service'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin@2026')

  const from =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : '/admin/orders'

  const loginMutation = useMutation({
    mutationFn: () => adminService.login(username, password),
    onSuccess: () => navigate(from.startsWith('/admin') ? from : '/admin/orders', { replace: true }),
  })

  if (isAdminLoggedIn()) {
    return <Navigate to="/admin/orders" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
              FO
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              FoodOrder
            </span>
          </Link>
          <p className="mt-2 text-sm text-slate-500">Admin access only</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                loginMutation.mutate()
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {loginMutation.isError ? (
                <p className="text-sm text-red-600" role="alert">
                  {getErrorMessage(loginMutation.error)}
                </p>
              ) : null}
              <Button className="w-full" type="submit" loading={loginMutation.isPending}>
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
