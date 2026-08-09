import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/shared/components/PageHeader'
import { Can } from '@/shared/components/Can'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { AuditoriaInfo } from '@/shared/components/AuditoriaInfo'
import { AuditoriaTimeline } from '@/features/auditoria/components/AuditoriaTimeline'
import { useCan } from '@/shared/components/Can'
import { formatCpfCnpj, formatDataHora, formatTelefone } from '@/lib/format'
import { useObterCliente } from '../hooks/useObterCliente'
import { useDesativarCliente } from '../hooks/useDesativarCliente'

/**
 * Monta o endereço em uma linha a partir dos campos estruturados do cliente
 * (ex.: "Rua das Flores, 123 - Centro - Maringá/PR"). Retorna `null` quando
 * nenhum campo está preenchido.
 */
function formatEndereco(c: {
  logradouro?: string | null
  numero?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
}): string | null {
  const partes: string[] = []

  const rua = [c.logradouro, c.numero].filter(Boolean).join(', ')
  if (rua) partes.push(rua)
  if (c.bairro) partes.push(c.bairro)

  const cidadeUf = c.uf ? [c.cidade, c.uf].filter(Boolean).join('/') : (c.cidade ?? '')
  if (cidadeUf) partes.push(cidadeUf)

  return partes.length ? partes.join(' - ') : null
}

export function ClienteDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()

  const { data: cliente, isLoading, isError } = useObterCliente(numericId)
  const desativar = useDesativarCliente()
  const podeVerAuditoria = useCan('auditoria.ver')

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full max-w-2xl" />
      </div>
    )
  }

  if (isError || !cliente) {
    return (
      <div className="space-y-3">
        <Button asChild variant="outline">
          <Link to="/clientes">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <p className="text-sm text-destructive">Cliente não encontrado.</p>
      </div>
    )
  }

  const isAtivo = cliente.ativo ?? true

  return (
    <div className="space-y-5">
      <PageHeader
        title={cliente.nome ?? '(sem nome)'}
        description={
          <span className="flex items-center gap-2">
            <span>Cliente #{cliente.id}</span>
            {!isAtivo && <Badge variant="secondary">Inativo</Badge>}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/clientes">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            {isAtivo && (
              <Button asChild>
                <Link to={`/clientes/${numericId}/editar`}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
            )}
            {isAtivo && (
              <Can permission="clientes.desativar">
                <ConfirmDialog
                  trigger={
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4" />
                      Desativar
                    </Button>
                  }
                  title="Desativar cliente?"
                  description={
                    <span>
                      O cliente <strong>{cliente.nome}</strong> será marcado como inativo. O
                      histórico de ordens de serviço e pagamentos é preservado, mas o cliente
                      não poderá abrir novas OS nem receberá cobranças automáticas.
                    </span>
                  }
                  confirmLabel="Desativar"
                  variant="destructive"
                  pending={desativar.isPending}
                  onConfirm={async () => {
                    try {
                      await desativar.mutateAsync(numericId)
                      toast.success('Cliente desativado.')
                      navigate('/clientes')
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
          <dt className="text-sm text-muted-foreground">Telefone</dt>
          <dd className="text-base tabular-nums">{formatTelefone(cliente.telefone)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">E-mail</dt>
          <dd className="text-base">{cliente.email ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">CPF / CNPJ</dt>
          <dd className="text-base tabular-nums">
            {cliente.cpfCnpj ? formatCpfCnpj(cliente.cpfCnpj) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Cadastrado em</dt>
          <dd className="text-base">{formatDataHora(cliente.criadoEm)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Endereço</dt>
          <dd className="text-base">{formatEndereco(cliente) ?? '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Observações</dt>
          <dd className="text-base whitespace-pre-line">{cliente.observacoes ?? '—'}</dd>
        </div>
      </dl>

      <AuditoriaInfo
        criadoEm={cliente.criadoEm}
        criadoPorUsuarioNome={cliente.criadoPorUsuarioNome}
        atualizadoEm={cliente.atualizadoEm}
        atualizadoPorUsuarioNome={cliente.atualizadoPorUsuarioNome}
      />

      {podeVerAuditoria && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Histórico de alterações</h3>
          <AuditoriaTimeline tipoEntidade="Cliente" entidadeId={numericId} />
        </section>
      )}
    </div>
  )
}
