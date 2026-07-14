import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { formatBRL } from '@/lib/format'
import type { CatalogoServicoDto } from '@/api/types'
import { useListarServicos } from '../hooks/useListarServicos'

export function ServicosListPage() {
  const navigate = useNavigate()
  const [incluirInativos, setIncluirInativos] = useState(false)
  const { data, isLoading } = useListarServicos(incluirInativos)

  const columns: ColumnDef<CatalogoServicoDto>[] = [
    {
      id: 'nome',
      header: 'Nome',
      cell: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{s.nome}</span>
          {s.ehMaoDeObraPadrao && (
            <Badge>
              <Star className="h-3 w-3" />
              Padrão
            </Badge>
          )}
          {!s.ativo && <Badge variant="secondary">Inativo</Badge>}
        </div>
      ),
    },
    {
      id: 'descricao',
      header: 'Descrição',
      cell: (s) => s.descricao ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'preco',
      header: <span className="text-right">Preço</span>,
      cell: (s) => <span className="tabular-nums">{formatBRL(s.preco ?? 0)}</span>,
      className: 'w-32 text-right',
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Serviços"
        description="Mão de obra e diagnósticos disponíveis nas Ordens de Serviço."
        actions={
          <Button asChild>
            <Link to="/servicos/novo">
              <Plus className="h-4 w-4" />
              Novo serviço
            </Link>
          </Button>
        }
      />

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={incluirInativos}
          onChange={(e) => setIncluirInativos(e.target.checked)}
        />
        Incluir inativos
      </label>

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(s) => s.id ?? `srv-${s.nome}`}
        onRowClick={(s) => navigate(`/servicos/${s.id}`)}
        empty={
          <EmptyState
            title="Nenhum serviço cadastrado"
            description="Cadastre o primeiro serviço para começar."
            action={
              <Button asChild>
                <Link to="/servicos/novo">
                  <Plus className="h-4 w-4" />
                  Novo serviço
                </Link>
              </Button>
            }
          />
        }
      />
    </div>
  )
}
