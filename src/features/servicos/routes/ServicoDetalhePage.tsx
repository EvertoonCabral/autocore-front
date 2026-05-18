import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/shared/components/PageHeader'
import { Can, useCan } from '@/shared/components/Can'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { AuditoriaInfo } from '@/shared/components/AuditoriaInfo'
import { AuditoriaTimeline } from '@/features/auditoria/components/AuditoriaTimeline'
import { formatBRL } from '@/lib/format'
import { AtualizarPrecoDialog } from '../components/AtualizarPrecoDialog'
import { useObterServico } from '../hooks/useObterServico'
import { useDesativarServico } from '../hooks/useDesativarServico'

export function ServicoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()

  const { data: servico, isLoading, isError } = useObterServico(numericId)
  const desativar = useDesativarServico()
  const podeVerAuditoria = useCan('auditoria.ver')

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full max-w-2xl" />
      </div>
    )
  }

  if (isError || !servico) {
    return (
      <div className="space-y-3">
        <Button asChild variant="outline">
          <Link to="/servicos">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <p className="text-sm text-destructive">Serviço não encontrado.</p>
      </div>
    )
  }

  const isAtivo = servico.ativo ?? true

  return (
    <div className="space-y-5">
      <PageHeader
        title={servico.nome ?? '(sem nome)'}
        description={
          <span className="flex items-center gap-2">
            <span>Serviço #{servico.id}</span>
            {servico.ehMaoDeObraPadrao && (
              <Badge>
                <Star className="h-3 w-3" />
                Padrão
              </Badge>
            )}
            {!isAtivo && <Badge variant="secondary">Inativo</Badge>}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/servicos">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            {isAtivo && (
              <Can permission="servicos.atualizarPreco">
                <AtualizarPrecoDialog
                  servico={{
                    id: servico.id ?? 0,
                    nome: servico.nome ?? '',
                    preco: servico.preco ?? 0,
                  }}
                />
              </Can>
            )}
            {isAtivo && (
              <Button asChild>
                <Link to={`/servicos/${numericId}/editar`}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
            )}
            {isAtivo && (
              <Can permission="servicos.desativar">
                <ConfirmDialog
                  trigger={
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4" />
                      Desativar
                    </Button>
                  }
                  title="Desativar serviço?"
                  description={
                    <span>
                      O serviço <strong>{servico.nome}</strong> ficará indisponível para novas
                      OSs. As OSs já abertas mantêm o snapshot do nome e preço.
                    </span>
                  }
                  confirmLabel="Desativar"
                  variant="destructive"
                  pending={desativar.isPending}
                  onConfirm={async () => {
                    try {
                      await desativar.mutateAsync(numericId)
                      toast.success('Serviço desativado.')
                      navigate('/servicos')
                    } catch (err) {
                      const apiErr = err as { message?: string }
                      toast.error(apiErr.message ?? 'Não foi possível desativar.')
                    }
                  }}
                />
              </Can>
            )}
          </div>
        }
      />

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-md border bg-card p-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Nome</dt>
          <dd className="text-base">{servico.nome ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Preço</dt>
          <dd className="text-base tabular-nums">{formatBRL(servico.preco ?? 0)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Descrição</dt>
          <dd className="text-base whitespace-pre-line">{servico.descricao ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Mão de obra padrão</dt>
          <dd className="text-base">{servico.ehMaoDeObraPadrao ? 'Sim' : 'Não'}</dd>
        </div>
      </dl>

      <AuditoriaInfo
        criadoEm={servico.criadoEm}
        criadoPorUsuarioNome={servico.criadoPorUsuarioNome}
        atualizadoEm={servico.atualizadoEm}
        atualizadoPorUsuarioNome={servico.atualizadoPorUsuarioNome}
      />

      {podeVerAuditoria && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Histórico de alterações</h3>
          <AuditoriaTimeline tipoEntidade="CatalogoServico" entidadeId={numericId} />
        </section>
      )}
    </div>
  )
}
