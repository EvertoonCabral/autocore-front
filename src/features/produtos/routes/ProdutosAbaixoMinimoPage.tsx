import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { formatBRL } from '@/lib/format'
import type { ProdutoDto } from '@/api/types'
import { useListarProdutosAbaixoMinimo } from '../hooks/useListarProdutosAbaixoMinimo'

export function ProdutosAbaixoMinimoPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useListarProdutosAbaixoMinimo()

  const columns: ColumnDef<ProdutoDto>[] = [
    {
      id: 'nome',
      header: 'Produto',
      cell: (p) => (
        <div className="flex flex-col">
          <span className="font-medium">{p.nome}</span>
          {p.referencia && <span className="text-xs text-muted-foreground">Ref. {p.referencia}</span>}
        </div>
      ),
    },
    {
      id: 'saldo',
      header: <span className="text-right">Saldo / Mínimo</span>,
      className: 'w-32 text-right',
      cell: (p) => (
        <span className="tabular-nums text-destructive">
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
        title="Produtos abaixo do mínimo"
        description="Itens cuja quantidade em estoque está abaixo do limite configurado."
        actions={
          <Button asChild variant="outline">
            <Link to="/produtos">
              <ArrowLeft className="h-4 w-4" />
              Todos os produtos
            </Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(p) => p.id ?? `prod-${p.nome}`}
        onRowClick={(p) => navigate(`/produtos/${p.id}`)}
        empty={
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5 text-emerald-600" />}
            title="Tudo em ordem"
            description="Nenhum produto está abaixo do estoque mínimo no momento."
          />
        }
      />
    </div>
  )
}
