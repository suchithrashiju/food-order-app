import { Skeleton } from '@/components/ui/skeleton'

export function LoadingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
