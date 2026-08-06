import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CategoryChipProps {
  label: string
  active?: boolean
  onClick: () => void
  icon?: ReactNode
}

export function CategoryChip({ label, active = false, onClick, icon }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition',
        active
          ? 'border-primary bg-primary text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
