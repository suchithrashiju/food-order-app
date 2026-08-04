import { cn } from '@/lib/utils'

interface CategoryChipProps {
  label: string
  active?: boolean
  onClick: () => void
}

export function CategoryChip({ label, active = false, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-4 py-2 text-sm font-medium transition',
        active
          ? 'border-primary bg-primary text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
      )}
    >
      {label}
    </button>
  )
}
