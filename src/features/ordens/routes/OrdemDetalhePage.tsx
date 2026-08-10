import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Ban, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusOrdemBadge } from '@/shared/components/StatusOrdemBadge'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { formatBRL, formatData, formatDataHora } from '@/lib/format'
import {
  podeCancelar,
  podeEditarItens,
  podeFechar,
  type StatusOrdem,
} from '@/shared/enums/statusOrdem'
import { useObterOrdem } from '../hooks/useObterOrdem'
import { useFecharOrdem } from '../hooks/useFecharOrdem'
import { useCancelarOrdem } from '../hooks/useCancelarOrdem'
import { EditarOrdemPanel } from '../components/EditarOrdemPanel'
import { ItensServicoTable } from '../components/ItensServicoTable'
import { ItensProdutoTable } from '../components/ItensProdutoTable'
import { AdicionarItemServicoDialog } from '../components/AdicionarItemServicoDialog'
import { AdicionarItemProdutoDialog } from '../components/AdicionarItemProdutoDialog'
import { PagamentosOrdemSection } from '@/features/pagamentos/components/PagamentosOrdemSection'
import { PdfDownloadButtons } from '../components/PdfDownloadButtons'
import { TimelineOrdem } from '../components/TimelineOrdem'
import { AuditoriaInfo } from '@/shared/components/AuditoriaInfo'
import { AuditoriaTimeline } from '@/features/auditoria/components/AuditoriaTimeline'
import { useCan } from '@/shared/components/Can'

export function OrdemDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()

  const { data: ordem, isLoading, isError } = useObterOrdem(numericId)
  const fechar = useFecharOrdem()
  const cancelar = useCancelarOrdem()
  const podeVerAuditoria = useCan('auditoria.ver')

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !ordem) {
    return (
      <div className="space-y-3">
        <Button asChild variant="outline">
          <Link to="/ordens">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <p className="text-sm text-destructive">OS não encontrada.</p>
      </div>
    )
  }

  const status = (ordem.status ?? 1) as StatusOrdem
  const editavel = podeEditarItens(status)
  const concluida = status === 4
  const cancelada = status === 5
  const itensServico = ordem.servicos ?? []
  const itensProduto = ordem.produtos ?? []
  const semItens = itensServico.length === 0 && itensProduto.length === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={ordem.numero ?? ''}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusOrdemBadge status={status} />
            <span>·</span>
            <Link to={`/clientes/${ordem.clienteId}`} className="font-medium hover:underline">
              {ordem.clienteNome}
            </Link>
            <span>·</span>
            <span>Aberta em {formatDataHora(ordem.abertaEm)}</span>
            {ordem.veiculoDescricao && (
              <>
                <span>·</span>
                <span className="font-medium">{ordem.veiculoDescricao}</span>
              </>
            )}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/ordens">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <PdfDownloadButtons
              ordemId={numericId}
              status={status}
              totalGeral={ordem.totalGeral ?? 0}
              totalPago={ordem.totalPago ?? 0}
            />
            {podeFechar(status) && (
              <ConfirmDialog
                trigger={
                  <Button>
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir OS
                  </Button>
                }
                title="Concluir esta OS?"
                description={
                  semItens ? (
                    <span className="flex items-start gap-2 text-destructive">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Esta OS não possui nenhum item. Confirme se deseja concluí-la mesmo
                        assim.
                      </span>
                    </span>
                  ) : (
                    <span>
                      Após concluir, a OS deixa de aceitar alterações de itens. A data de
                      vencimento do pagamento será calculada automaticamente.
                    </span>
                  )
                }
                confirmLabel="Concluir"
                pending={fechar.isPending}
                onConfirm={async () => {
                  try {
                    await fechar.mutateAsync({ id: numericId })
                    toast.success('OS concluída.')
                  } catch (err) {
                    const apiErr = err as { message?: string }
                    toast.error(apiErr.message ?? 'Não foi possível concluir.')
                  }
                }}
              />
            )}
            {podeCancelar(status) && (
              <ConfirmDialog
                trigger={
                  <Button variant="destructive">
                    <Ban className="h-4 w-4" />
                    Cancelar OS
                  </Button>
                }
                title="Cancelar esta OS?"
                description={
                  <span>
                    O estoque dos produtos cadastrados (não fornecidos pelo cliente) será
                    estornado. OS canceladas não podem ser reabertas.
                  </span>
                }
                confirmLabel="Cancelar OS"
                cancelLabel="Voltar"
                variant="destructive"
                pending={cancelar.isPending}
                onConfirm={async () => {
                  try {
                    await cancelar.mutateAsync(numericId)
                    toast.success('OS cancelada.')
                    navigate('/ordens')
                  } catch (err) {
                    const apiErr = err as { message?: string }
                    toast.error(apiErr.message ?? 'Não foi possível cancelar.')
                  }
                }}
              />
            )}
          </div>
        }
      />

      {/* Cards de totais */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryCard label="Total serviços" value={ordem.totalServicos ?? 0} />
        <SummaryCard label="Total produtos" value={ordem.totalProdutos ?? 0} />
        <SummaryCard label="Total geral" value={ordem.totalGeral ?? 0} highlight />
        <SummaryCard label="Total pago" value={ordem.totalPago ?? 0} />
        <SummaryCard
          label="Saldo devedor"
          value={ordem.saldoDevedor ?? 0}
          tone={(ordem.saldoDevedor ?? 0) > 0 ? 'destructive' : 'success'}
        />
      </div>

      {/* Datas extras quando concluída */}
      {(concluida || cancelada) && (
        <div className="flex flex-wrap gap-4 rounded-md border bg-muted/40 p-4 text-sm">
          {ordem.fechadaEm && (
            <div>
              <span className="text-muted-foreground">Concluída em:</span>{' '}
              <span className="font-medium">{formatDataHora(ordem.fechadaEm)}</span>
            </div>
          )}
          {ordem.dataVencimentoPagamento && (
            <div>
              <span className="text-muted-foreground">Vencimento do pagamento:</span>{' '}
              <span className="font-medium">{formatData(ordem.dataVencimentoPagamento)}</span>
            </div>
          )}
        </div>
      )}

      {/* Painel de edição (só se editável) */}
      {editavel ? (
        <EditarOrdemPanel
          ordemId={numericId}
          status={status}
          clienteId={ordem.clienteId}
          veiculoId={ordem.veiculoId}
          quilometragemEntrada={ordem.quilometragemEntrada}
          descricaoProblema={ordem.descricaoProblema}
          observacoes={ordem.observacoes}
          dataAgendamentoInicio={ordem.dataAgendamentoInicio}
        />
      ) : (
        <ReadOnlyDadosOS ordem={ordem} />
      )}

      {/* Itens de serviço */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Itens de serviço</h2>
          {editavel && <AdicionarItemServicoDialog ordemId={numericId} />}
        </div>
        <ItensServicoTable ordemId={numericId} itens={itensServico} podeEditar={editavel} />
      </section>

      {/* Itens de produto */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Itens de produto</h2>
          {editavel && <AdicionarItemProdutoDialog ordemId={numericId} />}
        </div>
        <ItensProdutoTable ordemId={numericId} itens={itensProduto} podeEditar={editavel} />
      </section>

      {/* Pagamentos — registrar + histórico + estorno Admin */}
      <PagamentosOrdemSection
        ordemId={numericId}
        numero={ordem.numero ?? ''}
        saldoDevedor={ordem.saldoDevedor ?? 0}
        podeRegistrar={concluida}
        clienteCpfCnpj={ordem.clienteCpfCnpj}
      />

      <section className="space-y-3">
        <h3 className="text-sm font-medium">Histórico da OS</h3>
        <TimelineOrdem ordemId={numericId} />
      </section>

      {podeVerAuditoria && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Auditoria detalhada</h3>
          <AuditoriaTimeline tipoEntidade="OrdemServico" entidadeId={numericId} />
        </section>
      )}

      <AuditoriaInfo
        criadoEm={ordem.abertaEm}
        criadoPorUsuarioNome={ordem.criadoPorUsuarioNome}
        atualizadoEm={ordem.atualizadoEm}
        atualizadoPorUsuarioNome={ordem.atualizadoPorUsuarioNome}
      />
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: number
  highlight?: boolean
  tone?: 'destructive' | 'success'
}

function SummaryCard({ label, value, highlight, tone }: SummaryCardProps) {
  const valueClass =
    tone === 'destructive'
      ? 'text-destructive'
      : tone === 'success'
        ? 'text-success-foreground'
        : ''

  return (
    <div
      className={`rounded-md border bg-card p-4 ${highlight ? 'ring-1 ring-primary/40' : ''}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${valueClass}`}>{formatBRL(value)}</p>
    </div>
  )
}

function ReadOnlyDadosOS({
  ordem,
}: {
  ordem: NonNullable<ReturnType<typeof useObterOrdem>['data']>
}) {
  return (
    <div className="rounded-md border bg-card p-6">
      <h2 className="text-lg font-semibold">Dados da OS</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        OS finalizada — somente leitura.
      </p>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Descrição do problema</dt>
          <dd className="text-sm whitespace-pre-line">{ordem.descricaoProblema ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Observações</dt>
          <dd className="text-sm whitespace-pre-line">{ordem.observacoes ?? '—'}</dd>
        </div>
      </dl>
    </div>
  )
}
