import { Outlet } from 'react-router'

import { Navbar } from '@/components/layout/Navbar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800">
        <p className="font-semibold text-slate-800 dark:text-slate-200">FoodOrder</p>
        <p>Delicious. Fast. Delivered.</p>
      </footer>
    </div>
  )
}
