import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/shared/components/Pagination'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { StatusOrdemBadge } from '@/shared/components/StatusOrdemBadge'
import { formatBRL, formatData } from '@/lib/format'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'
import type { OrdemServicoResumoDto } from '@/api/types'
import { useListarOrdens, type ListarOrdensParams } from '../hooks/useListarOrdens'

interface Props {
  params: ListarOrdensParams
  onPaginaChange: (p: number) => void
  onPorPaginaChange: (n: number) => void
  /** Se está buscando por texto — controla a exibição da contagem de resultados. */
  buscando?: boolean
}

const columns: ColumnDef<OrdemServicoResumoDto>[] = [
  {
    id: 'numero',
    header: 'Número',
    className: 'w-36 font-mono text-xs',
    cell: (o) => o.numero,
  },
  {
    id: 'cliente',
    header: 'Cliente',
    cell: (o) => o.clienteNome,
  },
  {
    id: 'veiculo',
    header: 'Veículo',
    cell: (o) => o.veiculoDescricao ?? '—',
  },
  {
    id: 'status',
    header: 'Status',
    className: 'w-44',
    cell: (o) => <StatusOrdemBadge status={o.status as StatusOrdem | undefined} />,
  },
  {
    id: 'aberta',
    header: 'Aberta em',
    className: 'w-28',
    cell: (o) => formatData(o.abertaEm),
  },
  {
    id: 'totalGeral',
    header: <span className="text-right">Total</span>,
    className: 'w-32 text-right',
    cell: (o) => <span className="tabular-nums">{formatBRL(o.totalGeral ?? 0)}</span>,
  },
  {
    id: 'saldo',
    header: <span className="text-right">Saldo</span>,
    className: 'w-32 text-right',
    cell: (o) => {
      const saldo = o.saldoDevedor ?? 0
      return (
        <span className={`tabular-nums ${saldo > 0 ? 'text-danger font-medium' : ''}`}>
          {formatBRL(saldo)}
        </span>
      )
    },
  },
]

export function ListaOrdens({ params, onPaginaChange, onPorPaginaChange, buscando }: Props) {
  const navigate = useNavigate()
  const { data, isLoading } = useListarOrdens(params)

  const temDados = Boolean(data && (data.dados?.length ?? 0) > 0)

  return (
    <div className="space-y-4">
      {buscando && data && (
        <p className="text-sm text-muted-foreground">
          {data.total} resultado{data.total === 1 ? '' : 's'}
        </p>
      )}

      <DataTable
        columns={columns}
        data={data?.dados ?? undefined}
        loading={isLoading}
        rowKey={(o) => o.id ?? `os-${o.numero}`}
        onRowClick={(o) => navigate(`/ordens/${o.id}`)}
        empty={
          <EmptyState
            title="Nenhuma OS encontrada"
            description="Abra a primeira ordem de serviço para começar."
            action={
              <Button asChild>
                <Link to="/ordens/nova">
                  <Plus className="h-4 w-4" />
                  Nova OS
                </Link>
              </Button>
            }
          />
        }
      />

      {data && temDados && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-faint bg-subtle/40 px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">
            Saldo total (filtro):{' '}
            <strong className="tabular-nums text-danger">
              {formatBRL(data.somaSaldoDevedor ?? 0)}
            </strong>
          </span>
          <span className="text-muted-foreground">
            Total geral (filtro):{' '}
            <strong className="tabular-nums text-foreground">
              {formatBRL(data.somaTotalGeral ?? 0)}
            </strong>
          </span>
        </div>
      )}

      {data && temDados && (
        <Pagination
          pagina={params.pagina}
          porPagina={params.porPagina}
          total={data.total ?? 0}
          onPaginaChange={onPaginaChange}
          onPorPaginaChange={onPorPaginaChange}
        />
      )}
    </div>
  )
}
