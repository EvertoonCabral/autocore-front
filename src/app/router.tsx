import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { LoginPage } from '@/features/auth/routes/LoginPage'
import { DashboardPage } from '@/features/dashboard/routes/DashboardPage'
import { RequireAuth } from '@/shared/guards/RequireAuth'
import { NotFound } from './NotFound'

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: (
      <RequireAuth>
        <AuthenticatedLayout />
      </RequireAuth>
    ),
    children: [{ path: '/', element: <DashboardPage /> }],
  },
  { path: '*', element: <NotFound /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
