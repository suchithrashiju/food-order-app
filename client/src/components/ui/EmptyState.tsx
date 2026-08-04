interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="state-panel state-panel--empty">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}
