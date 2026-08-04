import { useEffect, useState } from 'react'
import './App.css'
import type { MenuApiResponse, MenuItem } from './types/menu'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function App() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/menu`)
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data: MenuApiResponse = await response.json()
        setItems(data.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load menu')
      } finally {
        setLoading(false)
      }
    }

    void loadMenu()
  }, [])

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Food Order App</p>
        <h1>Delicious meals, ready to order.</h1>
        <p className="description">
          This client now connects to the backend menu API and displays live menu items.
        </p>

        {loading && <p>Loading menu...</p>}
        {error && <p role="alert">{error}</p>}

        {!loading && !error && (
          <div className="highlights">
            {items.map((item) => (
              <article key={item._id} className="menu-card">
                <h2>{item.name}</h2>
                <p>{item.description}</p>
                <p className="price">${item.price.toFixed(2)}</p>
                <span>{item.category}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
