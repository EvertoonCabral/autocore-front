import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/shared/components/PageHeader'
import { SearchInput } from '@/shared/components/SearchInput'
import { Pagination } from '@/shared/components/Pagination'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import type { VeiculoResumoDto } from '@/api/types'
import { useListarVeiculos } from '../hooks/useListarVeiculos'

export function VeiculosListPage() {
  const navigate = useNavigate()
  const { pagina, porPagina, q, filters, setPagina, setPorPagina, setQ, setFilter } =
    usePagedQuery({ porPagina: 20 })

  const incluirInativos = filters.inativos === 'true'

  const { data, isLoading } = useListarVeiculos({
    filtro: q,
    pagina,
    porPagina,
    incluirInativos,
  })

  const columns: ColumnDef<VeiculoResumoDto>[] = [
    {
      id: 'placa',
      header: 'Placa',
      className: 'w-32 font-medium tabular-nums',
      cell: (v) => (
        <div className="flex items-center gap-2">
          <span>{v.placa}</span>
          {!v.ativo && <Badge variant="secondary">Inativo</Badge>}
        </div>
      ),
    },
    {
      id: 'marcaModelo',
      header: 'Marca / Modelo',
      cell: (v) => {
        const partes = [v.marca, v.modelo].filter(Boolean)
        return partes.length ? partes.join(' ') : <span className="text-muted-foreground">—</span>
      },
    },
    {
      id: 'cliente',
      header: 'Cliente',
      cell: (v) => v.clienteNome ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'ano',
      header: 'Ano',
      className: 'w-24 tabular-nums',
      cell: (v) => v.anoModelo ?? <span className="text-muted-foreground">—</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Veículos"
        description="Veículos cadastrados e seus proprietários."
        actions={
          <Button asChild>
            <Link to="/veiculos/novo">
              <Plus className="h-4 w-4" />
              Novo veículo
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={q}
          onDebouncedChange={setQ}
          placeholder="Buscar por placa, modelo ou cliente…"
          className="sm:w-80"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={incluirInativos}
            onChange={(e) => setFilter('inativos', e.target.checked)}
          />
          Incluir inativos
        </label>
      </div>

      <DataTable
        columns={columns}
        data={data?.dados}
        loading={isLoading}
        rowKey={(v) => v.id ?? `vei-${v.placa}`}
        onRowClick={(v) => navigate(`/veiculos/${v.id}`)}
        empty={
          <EmptyState
            title="Nenhum veículo encontrado"
            description={
              q
                ? `Sem resultados para "${q}".`
                : 'Cadastre o primeiro veículo para começar.'
            }
            action={
              !q && (
                <Button asChild>
                  <Link to="/veiculos/novo">
                    <Plus className="h-4 w-4" />
                    Novo veículo
                  </Link>
                </Button>
              )
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
