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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { Can, useCan } from '@/shared/components/Can'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { formatBRL } from '@/lib/format'
import type { CatalogoServicoDto } from '@/api/types'
import { ServicoForm } from '../components/ServicoForm'
import { AtualizarPrecoDialog } from '../components/AtualizarPrecoDialog'
import type { ServicoFormValues } from '../helpers/servicoSchema'
import { useListarServicos } from '../hooks/useListarServicos'
import { useCriarServico } from '../hooks/useCriarServico'
import { useAtualizarServico } from '../hooks/useAtualizarServico'
import { useDesativarServico } from '../hooks/useDesativarServico'

/**
 * Ação pendente quando o usuário tenta marcar um novo serviço como padrão e
 * já existe outro padrão cadastrado. Resolvida pelo AlertDialog.
 */
interface PendenteTrocaPadrao {
  values: ServicoFormValues
  /** Id do serviço que está sendo editado (undefined = criação). */
  editandoId?: number | undefined
  /** Serviço que atualmente é padrão (será substituído). */
  padraoAtual: CatalogoServicoDto
}

export function ServicosListPage() {
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [novoOpen, setNovoOpen] = useState(false)
  const [editando, setEditando] = useState<CatalogoServicoDto | null>(null)
  const [pendente, setPendente] = useState<PendenteTrocaPadrao | null>(null)

  const { data, isLoading } = useListarServicos(incluirInativos)
  const criar = useCriarServico()
  const atualizar = useAtualizarServico()
  const desativar = useDesativarServico()

  const canAdmin = useCan('servicos.atualizarPreco')

  /**
   * Detecta se o submit do form precisa de confirmação. Retorna o serviço
   * atual padrão se houver — caller decide o que fazer.
   *
   * Regra: aciona a confirmação quando
   *   - usuário está marcando `ehMaoDeObraPadrao = true`
   *   - já existe outro serviço ativo com a flag (que não seja o próprio)
   */
  function detectarConflitoPadrao(
    values: ServicoFormValues,
    editandoId?: number,
  ): CatalogoServicoDto | null {
    if (!values.ehMaoDeObraPadrao) return null
    const padraoAtual = (data ?? []).find(
      (s) => s.ehMaoDeObraPadrao && s.ativo && s.id !== editandoId,
    )
    return padraoAtual ?? null
  }

  async function persistirNovo(values: ServicoFormValues) {
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
  }

  async function persistirEdicao(id: number, values: ServicoFormValues) {
    try {
      await atualizar.mutateAsync({ id, values })
      toast.success('Serviço atualizado.')
      setEditando(null)
    } catch (err) {
      const apiErr = err as { kind?: string; message?: string }
      if (apiErr.kind !== 'validation') {
        toast.error(apiErr.message ?? 'Não foi possível salvar.')
      }
      throw err
    }
  }

  async function confirmarTrocaPadrao() {
    if (!pendente) return
    const { values, editandoId } = pendente
    setPendente(null)
    if (editandoId == null) {
      await persistirNovo(values)
    } else {
      await persistirEdicao(editandoId, values)
    }
  }

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
                  const conflito = detectarConflitoPadrao(values, undefined)
                  if (conflito) {
                    setPendente({ values, padraoAtual: conflito })
                    return
                  }
                  await persistirNovo(values)
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
                const conflito = detectarConflitoPadrao(values, editando.id ?? undefined)
                if (conflito) {
                  setPendente({
                    values,
                    editandoId: editando.id ?? undefined,
                    padraoAtual: conflito,
                  })
                  return
                }
                await persistirEdicao(editando.id ?? 0, values)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmação de troca de mão-de-obra-padrão */}
      <AlertDialog open={!!pendente} onOpenChange={(o) => !o && setPendente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar a mão de obra padrão?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Já existe um serviço marcado como <strong>mão de obra padrão</strong>:{' '}
                  <span className="font-medium">{pendente?.padraoAtual.nome}</span>.
                </p>
                <p>
                  Apenas um serviço pode ser padrão por vez. Ao confirmar:
                </p>
                <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">
                      {pendente?.padraoAtual.nome}
                    </span>{' '}
                    deixa de ser o serviço padrão.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">{pendente?.values.nome}</span>{' '}
                    passa a ser o novo serviço padrão.
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={criar.isPending || atualizar.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={criar.isPending || atualizar.isPending}
              onClick={(e) => {
                e.preventDefault()
                void confirmarTrocaPadrao()
              }}
            >
              Confirmar troca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
