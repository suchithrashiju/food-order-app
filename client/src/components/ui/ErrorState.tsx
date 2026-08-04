interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="state-panel state-panel--error" role="alert">
      <h2>Could not load the menu</h2>
      <p>{message}</p>
      <button type="button" className="button button--primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
