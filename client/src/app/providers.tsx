import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'

import { CartProvider } from '@/features/cart/context/cart-context'
import { ThemeProvider } from '@/hooks/use-theme'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CartProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </CartProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
