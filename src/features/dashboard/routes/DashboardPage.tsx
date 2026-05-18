import { useAuth } from '@/features/auth/auth-context'
import { PageHeader } from '@/shared/components/PageHeader'
import { formatBRL } from '@/lib/format'
import { KpiCard } from '../components/KpiCard'
import { PendenciasAntigasCard } from '../components/PendenciasAntigasCard'
import { UltimasOrdensCard } from '../components/UltimasOrdensCard'
import { nomeMesPtBr } from '../helpers/nomeMes'
import { useDashboardResumo } from '../hooks/useDashboardResumo'

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useDashboardResumo()

  const tituloMes = data?.faturamento
    ? `Faturamento de ${nomeMesPtBr(data.faturamento.mes)}`
    : 'Faturamento do mês'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bem-vindo${user?.nomeCompleto ? ', ' + user.nomeCompleto : ''}`}
        description="Panorama da oficina em tempo real."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <KpiCard
          title="OS abertas"
          value={data?.contagensOs?.abertas}
          variant="info"
          loading={isLoading}
        />
        <KpiCard
          title="Em andamento"
          value={data?.contagensOs?.emAndamento}
          variant="warning"
          loading={isLoading}
        />
        <KpiCard
          title="Aguardando produto"
          value={data?.contagensOs?.aguardandoProduto}
          variant="warning"
          loading={isLoading}
        />
        <KpiCard
          title="Pendências vencidas"
          value={data?.pendencias?.vencidasCount}
          sub={
            data?.pendencias
              ? formatBRL(data.pendencias.vencidasValorTotal)
              : undefined
          }
          variant="destructive"
          loading={isLoading}
        />
        <KpiCard
          title="Estoque crítico"
          sub="Produtos abaixo do mínimo"
          value={data?.estoque?.produtosAbaixoMinimo}
          variant={
            data && (data.estoque?.produtosAbaixoMinimo ?? 0) > 0
              ? 'destructive'
              : 'success'
          }
          loading={isLoading}
        />
        <KpiCard
          title={tituloMes}
          value={data?.faturamento ? formatBRL(data.faturamento.total) : undefined}
          variant="success"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UltimasOrdensCard ordens={data?.ultimasOrdens ?? []} loading={isLoading} />
        <PendenciasAntigasCard
          pendencias={data?.pendenciasMaisAntigas ?? []}
          loading={isLoading}
        />
      </div>

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          Não foi possível carregar o painel. Tente recarregar a página.
        </p>
      ) : null}
    </div>
  )
}
