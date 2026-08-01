import { Navigate } from 'react-router-dom'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pagination } from '@/shared/components/Pagination'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { useCan } from '@/shared/components/Can'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { formatBRL } from '@/lib/format'
import type { RankingClienteDto } from '@/api/types'
import { useRankingClientes } from '../hooks/useRankingClientes'
import { PeriodoFiltro } from '../components/PeriodoFiltro'
import { BaixarCsvButton } from '../components/BaixarCsvButton'

export function RankingClientesPage() {
  const podeVer = useCan('relatorios.ver')
  const { pagina, porPagina, filters, setPagina, setPorPagina, setFilter } = usePagedQuery({
    porPagina: 20,
  })

  const de = filters.de ?? ''
  const ate = filters.ate ?? ''

  const { data, isLoading } = useRankingClientes(
    {
      pagina,
      porPagina,
      ...(de ? { de } : {}),
      ...(ate ? { ate } : {}),
    },
    { enabled: podeVer },
  )

  if (!podeVer) return <Navigate to="/" replace />

  const linhas = data?.dados ?? []

  const columns: ColumnDef<RankingClienteDto>[] = [
    {
      id: 'cliente',
      header: 'Cliente',
      cell: (row) => <span className="font-medium">{row.clienteNome ?? '—'}</span>,
    },
    {
      id: 'qtdOs',
      header: 'Qtd OSs',
      className: 'w-28 text-right',
      cell: (row) => <span className="tabular-nums">{row.qtdOs ?? 0}</span>,
    },
    {
      id: 'totalFaturado',
      header: 'Total faturado',
      className: 'w-44 text-right',
      cell: (row) => (
        <span className="tabular-nums">{formatBRL(row.totalFaturado)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ranking de clientes"
        description="Clientes que mais faturaram no período, com ticket médio e total de OSs."
      />

      <PeriodoFiltro
        de={de}
        ate={ate}
        onChange={(key, value) => setFilter(key, value)}
        extra={
          <div className="flex items-end">
            <BaixarCsvButton
              params={{
                path: '/api/relatorios/clientes/csv',
                query: {
                  ...(de ? { de } : {}),
                  ...(ate ? { ate } : {}),
                },
                defaultFilename: 'ranking-clientes.csv',
              }}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Total faturado"
          value={formatBRL(data?.totalFaturadoGeral)}
          variant="success"
          loading={isLoading}
        />
        <KpiCard
          title="Total de OSs"
          value={data?.totalOs ?? 0}
          variant="info"
          loading={isLoading}
        />
        <KpiCard
          title="Ticket médio"
          value={formatBRL(data?.ticketMedio)}
          loading={isLoading}
        />
      </div>

      <DataTable
        columns={columns}
        data={linhas}
        loading={isLoading}
        rowKey={(row) => row.clienteId ?? `cli-${row.clienteNome ?? ''}`}
        empty={
          <EmptyState
            title="Nenhum cliente no período"
            description="Ajuste o período ou aguarde novas ordens de serviço faturadas."
          />
        }
      />

      {linhas.length > 0 && (
        <Pagination
          pagina={pagina}
          porPagina={porPagina}
          total={data?.total ?? 0}
          onPaginaChange={setPagina}
          onPorPaginaChange={setPorPagina}
        />
      )}
    </div>
  )
}
