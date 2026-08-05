/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router'

import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'

const HomePage = lazy(() =>
  import('@/features/menu/pages/HomePage').then((module) => ({ default: module.HomePage })),
)
const MenuPage = lazy(() =>
  import('@/features/menu/pages/MenuPage').then((module) => ({ default: module.MenuPage })),
)
const CartPage = lazy(() =>
  import('@/features/cart/pages/CartPage').then((module) => ({ default: module.CartPage })),
)
const CheckoutPage = lazy(() =>
  import('@/features/order/pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })),
)
const OrderSuccessPage = lazy(() =>
  import('@/features/order/pages/OrderSuccessPage').then((module) => ({
    default: module.OrderSuccessPage,
  })),
)
const TrackOrderPage = lazy(() =>
  import('@/features/order/pages/TrackOrderPage').then((module) => ({
    default: module.TrackOrderPage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('@/features/admin/pages/AdminDashboardPage').then((module) => ({
    default: module.AdminDashboardPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/features/menu/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

function SuspensePage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingSkeleton count={4} />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <SuspensePage>
            <HomePage />
          </SuspensePage>
        ),
      },
      {
        path: 'menu',
        element: (
          <SuspensePage>
            <MenuPage />
          </SuspensePage>
        ),
      },
      {
        path: 'cart',
        element: (
          <SuspensePage>
            <CartPage />
          </SuspensePage>
        ),
      },
      {
        path: 'checkout',
        element: (
          <SuspensePage>
            <CheckoutPage />
          </SuspensePage>
        ),
      },
      {
        path: 'orders/:orderId/success',
        element: (
          <SuspensePage>
            <OrderSuccessPage />
          </SuspensePage>
        ),
      },
      {
        path: 'track',
        element: (
          <SuspensePage>
            <TrackOrderPage />
          </SuspensePage>
        ),
      },
      {
        path: 'track/:orderId',
        element: (
          <SuspensePage>
            <TrackOrderPage />
          </SuspensePage>
        ),
      },
      {
        path: 'admin',
        element: (
          <SuspensePage>
            <AdminDashboardPage />
          </SuspensePage>
        ),
      },
      {
        path: '*',
        element: (
          <SuspensePage>
            <NotFoundPage />
          </SuspensePage>
        ),
      },
    ],
  },
])
