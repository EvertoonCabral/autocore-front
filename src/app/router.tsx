import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { LoginPage } from '@/features/auth/routes/LoginPage'
import { DashboardPage } from '@/features/dashboard/routes/DashboardPage'
import { ClientesListPage } from '@/features/clientes/routes/ClientesListPage'
import { NovoClientePage } from '@/features/clientes/routes/NovoClientePage'
import { ClienteDetalhePage } from '@/features/clientes/routes/ClienteDetalhePage'
import { EditarClientePage } from '@/features/clientes/routes/EditarClientePage'
import { ServicosListPage } from '@/features/servicos/routes/ServicosListPage'
import { ProdutosListPage } from '@/features/produtos/routes/ProdutosListPage'
import { ProdutosAbaixoMinimoPage } from '@/features/produtos/routes/ProdutosAbaixoMinimoPage'
import { NovoProdutoPage } from '@/features/produtos/routes/NovoProdutoPage'
import { ProdutoDetalhePage } from '@/features/produtos/routes/ProdutoDetalhePage'
import { EditarProdutoPage } from '@/features/produtos/routes/EditarProdutoPage'
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
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/clientes', element: <ClientesListPage /> },
      { path: '/clientes/novo', element: <NovoClientePage /> },
      { path: '/clientes/:id', element: <ClienteDetalhePage /> },
      { path: '/clientes/:id/editar', element: <EditarClientePage /> },
      { path: '/servicos', element: <ServicosListPage /> },
      { path: '/produtos', element: <ProdutosListPage /> },
      { path: '/produtos/abaixo-minimo', element: <ProdutosAbaixoMinimoPage /> },
      { path: '/produtos/novo', element: <NovoProdutoPage /> },
      { path: '/produtos/:id', element: <ProdutoDetalhePage /> },
      { path: '/produtos/:id/editar', element: <EditarProdutoPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
