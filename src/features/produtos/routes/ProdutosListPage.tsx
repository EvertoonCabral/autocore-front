import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/shared/components/PageHeader'
import { SearchInput } from '@/shared/components/SearchInput'
import { Pagination } from '@/shared/components/Pagination'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import { formatBRL } from '@/lib/format'
import type { ProdutoDto } from '@/api/types'
import { useListarProdutos } from '../hooks/useListarProdutos'

export function ProdutosListPage() {
  const navigate = useNavigate()
  const { pagina, porPagina, q, filters, setPagina, setPorPagina, setQ, setFilter } =
    usePagedQuery({ porPagina: 20 })

  const incluirInativos = filters.inativos === 'true'

  const { data, isLoading } = useListarProdutos({
    filtro: q,
    pagina,
    porPagina,
    incluirInativos,
  })

  const columns: ColumnDef<ProdutoDto>[] = [
    {
      id: 'nome',
      header: 'Produto',
      cell: (p) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{p.nome}</span>
            {!p.ativo && <Badge variant="secondary">Inativo</Badge>}
            {(p.quantidadeEstoque ?? 0) < (p.estoqueMinimo ?? 0) && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3" />
                Abaixo do mínimo
              </Badge>
            )}
          </div>
          {p.referencia && (
            <span className="text-xs text-muted-foreground">Ref. {p.referencia}</span>
          )}
        </div>
      ),
    },
    {
      id: 'estoque',
      header: <span className="text-right">Estoque</span>,
      className: 'w-28 text-right',
      cell: (p) => (
        <span className="tabular-nums">
          {p.quantidadeEstoque}
          <span className="ml-1 text-muted-foreground">/ {p.estoqueMinimo}</span>
        </span>
      ),
    },
    {
      id: 'venda',
      header: <span className="text-right">Venda</span>,
      className: 'w-32 text-right',
      cell: (p) => <span className="tabular-nums">{formatBRL(p.precoVenda ?? 0)}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Produtos"
        description="Cadastro de peças e itens de estoque."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/produtos/abaixo-minimo">
                <AlertTriangle className="h-4 w-4" />
                Abaixo do mínimo
              </Link>
            </Button>
            <Button asChild>
              <Link to="/produtos/novo">
                <Plus className="h-4 w-4" />
                Novo produto
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={q}
          onDebouncedChange={setQ}
          placeholder="Buscar por nome ou referência…"
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
        rowKey={(p) => p.id ?? `prod-${p.nome}`}
        onRowClick={(p) => navigate(`/produtos/${p.id}`)}
        empty={
          <EmptyState
            title="Nenhum produto encontrado"
            description={
              q ? `Sem resultados para "${q}".` : 'Cadastre o primeiro produto para começar.'
            }
            action={
              !q && (
                <Button asChild>
                  <Link to="/produtos/novo">
                    <Plus className="h-4 w-4" />
                    Novo produto
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
