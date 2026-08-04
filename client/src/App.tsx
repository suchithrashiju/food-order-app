import { AppHeader } from '@/components/layout/AppHeader'
import { MenuPage } from '@/components/menu/MenuPage'
import '@/styles/menu.css'

function App() {
  return (
    <main className="app-shell">
      <AppHeader />
      <MenuPage />
    </main>
  )
}

export default App
