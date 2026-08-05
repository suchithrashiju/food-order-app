import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="max-w-md text-slate-500">
        The page you requested does not exist or may have moved.
      </p>
      <Button asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  )
}
