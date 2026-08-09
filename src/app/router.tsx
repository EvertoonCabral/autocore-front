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
const ClienteFormDrawer = lazy(() => import('@/features/clientes/components/ClienteFormDrawer').then((m) => ({ default: m.ClienteFormDrawer })))
const ClienteDetalhePage = lazy(() => import('@/features/clientes/routes/ClienteDetalhePage').then((m) => ({ default: m.ClienteDetalhePage })))
const ServicosListPage = lazy(() => import('@/features/servicos/routes/ServicosListPage').then((m) => ({ default: m.ServicosListPage })))
const ServicoFormDrawer = lazy(() => import('@/features/servicos/components/ServicoFormDrawer').then((m) => ({ default: m.ServicoFormDrawer })))
const ServicoDetalhePage = lazy(() => import('@/features/servicos/routes/ServicoDetalhePage').then((m) => ({ default: m.ServicoDetalhePage })))
const ProdutosListPage = lazy(() => import('@/features/produtos/routes/ProdutosListPage').then((m) => ({ default: m.ProdutosListPage })))
const ProdutosAbaixoMinimoPage = lazy(() => import('@/features/produtos/routes/ProdutosAbaixoMinimoPage').then((m) => ({ default: m.ProdutosAbaixoMinimoPage })))
const ProdutoFormDrawer = lazy(() => import('@/features/produtos/components/ProdutoFormDrawer').then((m) => ({ default: m.ProdutoFormDrawer })))
const ProdutoDetalhePage = lazy(() => import('@/features/produtos/routes/ProdutoDetalhePage').then((m) => ({ default: m.ProdutoDetalhePage })))
const VeiculosListPage = lazy(() => import('@/features/veiculos/routes/VeiculosListPage').then((m) => ({ default: m.VeiculosListPage })))
const VeiculoFormDrawer = lazy(() => import('@/features/veiculos/components/VeiculoFormDrawer').then((m) => ({ default: m.VeiculoFormDrawer })))
const VeiculoDetalhePage = lazy(() => import('@/features/veiculos/routes/VeiculoDetalhePage').then((m) => ({ default: m.VeiculoDetalhePage })))
const OrdensListPage = lazy(() => import('@/features/ordens/routes/OrdensListPage').then((m) => ({ default: m.OrdensListPage })))
const NovaOrdemModal = lazy(() => import('@/features/ordens/routes/NovaOrdemModal').then((m) => ({ default: m.NovaOrdemModal })))
const OrdemDetalhePage = lazy(() => import('@/features/ordens/routes/OrdemDetalhePage').then((m) => ({ default: m.OrdemDetalhePage })))
const PendenciasPage = lazy(() => import('@/features/pagamentos/routes/PendenciasPage').then((m) => ({ default: m.PendenciasPage })))
const HistoricoCobrancaPage = lazy(() => import('@/features/cobrancas/routes/HistoricoCobrancaPage').then((m) => ({ default: m.HistoricoCobrancaPage })))
const ConfiguracoesPage = lazy(() => import('@/features/configuracoes/routes/ConfiguracoesPage').then((m) => ({ default: m.ConfiguracoesPage })))
const UsuariosPage = lazy(() => import('@/features/usuarios/routes/UsuariosPage').then((m) => ({ default: m.UsuariosPage })))
const AuditoriaRelatorioPage = lazy(() => import('@/features/auditoria/routes/AuditoriaRelatorioPage').then((m) => ({ default: m.AuditoriaRelatorioPage })))
const RelatoriosPage = lazy(() => import('@/features/relatorios/routes/RelatoriosPage').then((m) => ({ default: m.RelatoriosPage })))
const FaturamentoRecebidoPage = lazy(() => import('@/features/relatorios/routes/FaturamentoRecebidoPage').then((m) => ({ default: m.FaturamentoRecebidoPage })))
const ResumoFinanceiroPage = lazy(() => import('@/features/relatorios/routes/ResumoFinanceiroPage').then((m) => ({ default: m.ResumoFinanceiroPage })))
const RankingClientesPage = lazy(() => import('@/features/relatorios/routes/RankingClientesPage').then((m) => ({ default: m.RankingClientesPage })))

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
      {
        path: '/clientes',
        element: <ClientesListPage />,
        children: [
          { path: 'novo', element: <ClienteFormDrawer mode="criar" /> },
          { path: ':id/editar', element: <ClienteFormDrawer mode="editar" /> },
        ],
      },
      { path: '/clientes/:id', element: <ClienteDetalhePage /> },
      {
        path: '/servicos',
        element: <ServicosListPage />,
        children: [
          { path: 'novo', element: <ServicoFormDrawer mode="criar" /> },
          { path: ':id/editar', element: <ServicoFormDrawer mode="editar" /> },
        ],
      },
      { path: '/servicos/:id', element: <ServicoDetalhePage /> },
      {
        path: '/produtos',
        element: <ProdutosListPage />,
        children: [
          { path: 'novo', element: <ProdutoFormDrawer mode="criar" /> },
          { path: ':id/editar', element: <ProdutoFormDrawer mode="editar" /> },
        ],
      },
      { path: '/produtos/abaixo-minimo', element: <ProdutosAbaixoMinimoPage /> },
      { path: '/produtos/:id', element: <ProdutoDetalhePage /> },
      {
        path: '/veiculos',
        element: <VeiculosListPage />,
        children: [
          { path: 'novo', element: <VeiculoFormDrawer mode="criar" /> },
          { path: ':id/editar', element: <VeiculoFormDrawer mode="editar" /> },
        ],
      },
      { path: '/veiculos/:id', element: <VeiculoDetalhePage /> },
      {
        path: '/ordens',
        element: <OrdensListPage />,
        children: [{ path: 'nova', element: <NovaOrdemModal /> }],
      },
      { path: '/ordens/:id', element: <OrdemDetalhePage /> },
      { path: '/pendencias', element: <PendenciasPage /> },
      { path: '/cobrancas', element: <HistoricoCobrancaPage /> },
      { path: '/relatorios', element: <RelatoriosPage /> },
      { path: '/relatorios/faturamento', element: <FaturamentoRecebidoPage /> },
      { path: '/relatorios/financeiro', element: <ResumoFinanceiroPage /> },
      { path: '/relatorios/clientes', element: <RankingClientesPage /> },
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
