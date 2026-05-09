import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pagination } from '@/shared/components/Pagination'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { StatusOrdemBadge } from '@/shared/components/StatusOrdemBadge'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import { formatBRL, formatData } from '@/lib/format'
import { STATUS_ORDEM_OPTIONS, type StatusOrdem } from '@/shared/enums/statusOrdem'
import type { OrdemServicoResumoDto } from '@/api/types'
import { useListarOrdens } from '../hooks/useListarOrdens'

export function OrdensListPage() {
  const navigate = useNavigate()
  const { pagina, porPagina, filters, setPagina, setPorPagina, setFilter } = usePagedQuery({
    porPagina: 20,
  })

  const status = filters.status ? (Number(filters.status) as StatusOrdem) : undefined
  const abertaDe = filters.de ?? undefined
  const abertaAte = filters.ate ?? undefined

  const { data, isLoading } = useListarOrdens({
    pagina,
    porPagina,
    ...(status ? { status } : {}),
    ...(abertaDe ? { abertaDe } : {}),
    ...(abertaAte ? { abertaAte } : {}),
  })

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
          <span className={`tabular-nums ${saldo > 0 ? 'text-destructive font-medium' : ''}`}>
            {formatBRL(saldo)}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ordens de Serviço"
        description="Trabalhos abertos, em andamento e finalizados."
        actions={
          <Button asChild>
            <Link to="/ordens/nova">
              <Plus className="h-4 w-4" />
              Nova OS
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            value={status ? String(status) : 'all'}
            onValueChange={(v) => setFilter('status', v === 'all' ? null : v)}
          >
            <SelectTrigger id="filter-status" className="w-48">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_ORDEM_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={String(s.value)}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-de">Aberta de</Label>
          <Input
            id="filter-de"
            type="date"
            className="w-40"
            value={abertaDe ?? ''}
            onChange={(e) => setFilter('de', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-ate">Até</Label>
          <Input
            id="filter-ate"
            type="date"
            className="w-40"
            value={abertaAte ?? ''}
            onChange={(e) => setFilter('ate', e.target.value)}
          />
        </div>
        {(status || abertaDe || abertaAte) && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilter('status', null)
              setFilter('de', null)
              setFilter('ate', null)
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.dados}
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

      {data && data.dados.length > 0 && (
        <Pagination
          pagina={pagina}
          porPagina={porPagina}
          total={data.total}
          onPaginaChange={setPagina}
          onPorPaginaChange={setPorPagina}
        />
      )}
    </div>
  )
}
