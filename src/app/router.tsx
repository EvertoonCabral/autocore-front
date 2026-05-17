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
import { OrdensListPage } from '@/features/ordens/routes/OrdensListPage'
import { NovaOrdemPage } from '@/features/ordens/routes/NovaOrdemPage'
import { OrdemDetalhePage } from '@/features/ordens/routes/OrdemDetalhePage'
import { PendenciasPage } from '@/features/pagamentos/routes/PendenciasPage'
import { HistoricoCobrancaPage } from '@/features/cobrancas/routes/HistoricoCobrancaPage'
import { ConfiguracoesPage } from '@/features/configuracoes/routes/ConfiguracoesPage'
import { UsuariosPage } from '@/features/usuarios/routes/UsuariosPage'
import { AuditoriaRelatorioPage } from '@/features/auditoria/routes/AuditoriaRelatorioPage'
import { RequireAuth } from '@/shared/guards/RequireAuth'
import { RequireRole } from '@/shared/guards/RequireRole'
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
      { path: '/ordens', element: <OrdensListPage /> },
      { path: '/ordens/nova', element: <NovaOrdemPage /> },
      { path: '/ordens/:id', element: <OrdemDetalhePage /> },
      { path: '/pendencias', element: <PendenciasPage /> },
      { path: '/cobrancas', element: <HistoricoCobrancaPage /> },
      { path: '/relatorios/auditoria', element: <AuditoriaRelatorioPage /> },
      { path: '/usuarios', element: <UsuariosPage /> },
      {
        path: '/configuracoes',
        element: (
          // eslint-disable-next-line jsx-a11y/aria-role -- `role` é prop do nosso guard, não ARIA
          <RequireRole role="Admin">
            <ConfiguracoesPage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
