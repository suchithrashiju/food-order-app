import { Menu, Moon, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/admin.service'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/menu-items', label: 'Menu Items', end: false },
  { to: '/admin/orders', label: 'Orders', end: false },
]

export function AdminNavbar() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (!confirmed) return
    adminService.logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/admin"
          className="flex shrink-0 cursor-pointer items-center gap-2"
          aria-label="FoodOrder admin"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            FO
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            FoodOrder
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Admin
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Admin">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="hidden cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 md:inline-flex dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Logout
          </button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <nav
          className="border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800"
          aria-label="Admin mobile"
        >
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-2.5 text-sm font-medium',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-700 dark:text-slate-200',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                handleLogout()
              }}
              className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Logout
            </button>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
