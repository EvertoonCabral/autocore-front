import { useState } from 'react'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { Can, useCan } from '@/shared/components/Can'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { formatBRL } from '@/lib/format'
import type { CatalogoServicoDto } from '@/api/types'
import { ServicoForm } from '../components/ServicoForm'
import { AtualizarPrecoDialog } from '../components/AtualizarPrecoDialog'
import { useListarServicos } from '../hooks/useListarServicos'
import { useCriarServico } from '../hooks/useCriarServico'
import { useAtualizarServico } from '../hooks/useAtualizarServico'
import { useDesativarServico } from '../hooks/useDesativarServico'

export function ServicosListPage() {
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [novoOpen, setNovoOpen] = useState(false)
  const [editando, setEditando] = useState<CatalogoServicoDto | null>(null)

  const { data, isLoading } = useListarServicos(incluirInativos)
  const criar = useCriarServico()
  const atualizar = useAtualizarServico()
  const desativar = useDesativarServico()

  const canAdmin = useCan('servicos.atualizarPreco')

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
      header: 'Preço',
      cell: (s) => <span className="tabular-nums">{formatBRL(s.preco ?? 0)}</span>,
      className: 'w-32 text-right',
    },
    {
      id: 'acoes',
      header: <span className="sr-only">Ações</span>,
      className: 'w-[260px] text-right',
      cell: (s) => {
        if (!s.ativo) return null
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditando(s)}
              aria-label={`Editar ${s.nome}`}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Can permission="servicos.atualizarPreco">
              <AtualizarPrecoDialog
                servico={{ id: s.id ?? 0, nome: s.nome ?? '', preco: s.preco ?? 0 }}
              />
            </Can>
            <Can permission="servicos.desativar">
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" size="sm" aria-label={`Desativar ${s.nome}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
                title="Desativar serviço?"
                description={
                  <span>
                    O serviço <strong>{s.nome}</strong> ficará indisponível para novas OSs. As
                    OSs já abertas mantêm o snapshot do nome e preço.
                  </span>
                }
                confirmLabel="Desativar"
                variant="destructive"
                pending={desativar.isPending}
                onConfirm={async () => {
                  try {
                    await desativar.mutateAsync(s.id ?? 0)
                    toast.success('Serviço desativado.')
                  } catch (err) {
                    const apiErr = err as { message?: string }
                    toast.error(apiErr.message ?? 'Não foi possível desativar.')
                  }
                }}
              />
            </Can>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Catálogo de serviços"
        description="Mão de obra e diagnósticos disponíveis nas Ordens de Serviço."
        actions={
          <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Novo serviço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo serviço</DialogTitle>
              </DialogHeader>
              <ServicoForm
                submitLabel="Cadastrar"
                onCancel={() => setNovoOpen(false)}
                onSubmit={async (values) => {
                  try {
                    await criar.mutateAsync(values)
                    toast.success('Serviço cadastrado.')
                    setNovoOpen(false)
                  } catch (err) {
                    const apiErr = err as { kind?: string; message?: string }
                    if (apiErr.kind !== 'validation') {
                      toast.error(apiErr.message ?? 'Não foi possível cadastrar.')
                    }
                    throw err
                  }
                }}
              />
            </DialogContent>
          </Dialog>
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
        empty={<EmptyState title="Nenhum serviço cadastrado" description="Cadastre o primeiro serviço para começar." />}
      />

      {/* Dialog de edição */}
      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar — {editando?.nome}</DialogTitle>
          </DialogHeader>
          {editando && (
            <ServicoForm
              key={editando.id}
              submitLabel="Salvar"
              precoReadonly={!canAdmin}
              defaultValues={{
                nome: editando.nome ?? '',
                descricao: editando.descricao ?? '',
                preco: editando.preco ?? 0,
                ehMaoDeObraPadrao: editando.ehMaoDeObraPadrao ?? false,
              }}
              onCancel={() => setEditando(null)}
              onSubmit={async (values) => {
                try {
                  await atualizar.mutateAsync({ id: editando.id ?? 0, values })
                  toast.success('Serviço atualizado.')
                  setEditando(null)
                } catch (err) {
                  const apiErr = err as { kind?: string; message?: string }
                  if (apiErr.kind !== 'validation') {
                    toast.error(apiErr.message ?? 'Não foi possível salvar.')
                  }
                  throw err
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
