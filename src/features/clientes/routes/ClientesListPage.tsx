import { Link, useNavigate, Outlet } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/shared/components/PageHeader'
import { SearchInput } from '@/shared/components/SearchInput'
import { Pagination } from '@/shared/components/Pagination'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import { formatTelefone } from '@/lib/format'
import type { ClienteDto } from '@/api/types'
import { useListarClientes } from '../hooks/useListarClientes'

export function ClientesListPage() {
  const navigate = useNavigate()
  const { pagina, porPagina, q, filters, setPagina, setPorPagina, setQ, setFilter } =
    usePagedQuery({ porPagina: 20 })

  const incluirInativos = filters.inativos === 'true'

  const { data, isLoading } = useListarClientes({
    filtro: q,
    pagina,
    porPagina,
    incluirInativos,
  })

  const columns: ColumnDef<ClienteDto>[] = [
    {
      id: 'nome',
      header: 'Nome',
      cell: (c) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{c.nome}</span>
          {!c.ativo && <Badge variant="secondary">Inativo</Badge>}
        </div>
      ),
    },
    {
      id: 'telefone',
      header: 'Telefone',
      cell: (c) => <span className="tabular-nums">{formatTelefone(c.telefone)}</span>,
      className: 'w-44',
    },
    {
      id: 'email',
      header: 'E-mail',
      cell: (c) => c.email ?? <span className="text-muted-foreground">—</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes da auto elétrica."
        actions={
          <Button asChild>
            <Link to="/clientes/novo">
              <Plus className="h-4 w-4" />
              Novo cliente
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={q}
          onDebouncedChange={setQ}
          placeholder="Buscar por nome ou telefone…"
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
        rowKey={(c) => c.id ?? `cli-${c.nome}`}
        onRowClick={(c) => navigate(`/clientes/${c.id}`)}
        empty={
          <EmptyState
            title="Nenhum cliente encontrado"
            description={
              q
                ? `Sem resultados para "${q}".`
                : 'Cadastre o primeiro cliente para começar.'
            }
            action={
              !q && (
                <Button asChild>
                  <Link to="/clientes/novo">
                    <Plus className="h-4 w-4" />
                    Novo cliente
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

      {/* Drawer de novo/editar cliente (rotas aninhadas) */}
      <Outlet />
    </div>
  )
}
