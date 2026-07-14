import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { RequireAuth } from '@/shared/guards/RequireAuth'
import { RequireRole } from '@/shared/guards/RequireRole'
import { NotFound } from './NotFound'

// Páginas carregadas sob demanda (code splitting): cada rota vira um chunk
// próprio, tirando páginas pesadas (ex.: Dashboard + recharts) do bundle
// inicial. As páginas usam named export, daí o wrapper para o default do lazy.
// Layouts e guards ficam eager (estão no caminho crítico de toda navegação).
const LoginPage = lazy(() => import('@/features/auth/routes/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/routes/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ClientesListPage = lazy(() => import('@/features/clientes/routes/ClientesListPage').then((m) => ({ default: m.ClientesListPage })))
const NovoClientePage = lazy(() => import('@/features/clientes/routes/NovoClientePage').then((m) => ({ default: m.NovoClientePage })))
const ClienteDetalhePage = lazy(() => import('@/features/clientes/routes/ClienteDetalhePage').then((m) => ({ default: m.ClienteDetalhePage })))
const EditarClientePage = lazy(() => import('@/features/clientes/routes/EditarClientePage').then((m) => ({ default: m.EditarClientePage })))
const ServicosListPage = lazy(() => import('@/features/servicos/routes/ServicosListPage').then((m) => ({ default: m.ServicosListPage })))
const NovoServicoPage = lazy(() => import('@/features/servicos/routes/NovoServicoPage').then((m) => ({ default: m.NovoServicoPage })))
const ServicoDetalhePage = lazy(() => import('@/features/servicos/routes/ServicoDetalhePage').then((m) => ({ default: m.ServicoDetalhePage })))
const EditarServicoPage = lazy(() => import('@/features/servicos/routes/EditarServicoPage').then((m) => ({ default: m.EditarServicoPage })))
const ProdutosListPage = lazy(() => import('@/features/produtos/routes/ProdutosListPage').then((m) => ({ default: m.ProdutosListPage })))
const ProdutosAbaixoMinimoPage = lazy(() => import('@/features/produtos/routes/ProdutosAbaixoMinimoPage').then((m) => ({ default: m.ProdutosAbaixoMinimoPage })))
const NovoProdutoPage = lazy(() => import('@/features/produtos/routes/NovoProdutoPage').then((m) => ({ default: m.NovoProdutoPage })))
const ProdutoDetalhePage = lazy(() => import('@/features/produtos/routes/ProdutoDetalhePage').then((m) => ({ default: m.ProdutoDetalhePage })))
const EditarProdutoPage = lazy(() => import('@/features/produtos/routes/EditarProdutoPage').then((m) => ({ default: m.EditarProdutoPage })))
const OrdensListPage = lazy(() => import('@/features/ordens/routes/OrdensListPage').then((m) => ({ default: m.OrdensListPage })))
const NovaOrdemPage = lazy(() => import('@/features/ordens/routes/NovaOrdemPage').then((m) => ({ default: m.NovaOrdemPage })))
const OrdemDetalhePage = lazy(() => import('@/features/ordens/routes/OrdemDetalhePage').then((m) => ({ default: m.OrdemDetalhePage })))
const PendenciasPage = lazy(() => import('@/features/pagamentos/routes/PendenciasPage').then((m) => ({ default: m.PendenciasPage })))
const HistoricoCobrancaPage = lazy(() => import('@/features/cobrancas/routes/HistoricoCobrancaPage').then((m) => ({ default: m.HistoricoCobrancaPage })))
const ConfiguracoesPage = lazy(() => import('@/features/configuracoes/routes/ConfiguracoesPage').then((m) => ({ default: m.ConfiguracoesPage })))
const UsuariosPage = lazy(() => import('@/features/usuarios/routes/UsuariosPage').then((m) => ({ default: m.UsuariosPage })))
const AuditoriaRelatorioPage = lazy(() => import('@/features/auditoria/routes/AuditoriaRelatorioPage').then((m) => ({ default: m.AuditoriaRelatorioPage })))

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
      { path: '/servicos/novo', element: <NovoServicoPage /> },
      { path: '/servicos/:id', element: <ServicoDetalhePage /> },
      { path: '/servicos/:id/editar', element: <EditarServicoPage /> },
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
