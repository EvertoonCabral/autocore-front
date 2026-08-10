import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Paperclip, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pagination } from '@/shared/components/Pagination'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { Can } from '@/shared/components/Can'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import { formatDataHora, formatTelefone } from '@/lib/format'
import type { HistoricoCobrancaDto } from '@/api/types'
import { useListarHistoricoCobranca } from '../hooks/useListarHistorico'
import { useDispararCobranca } from '../hooks/useDispararCobranca'

export function HistoricoCobrancaPage() {
  const navigate = useNavigate()
  const { pagina, porPagina, filters, setPagina, setPorPagina, setFilter } = usePagedQuery({
    porPagina: 20,
  })

  const somenteFalhas = filters.falhas === 'true'
  const ordemServicoId = filters.ordem ? Number(filters.ordem) : undefined

  const { data, isLoading } = useListarHistoricoCobranca({
    pagina,
    porPagina,
    somenteFalhas,
    ...(ordemServicoId ? { ordemServicoId } : {}),
  })

  const disparar = useDispararCobranca()

  const columns: ColumnDef<HistoricoCobrancaDto>[] = [
    {
      id: 'enviadoEm',
      header: 'Enviado em',
      className: 'w-44',
      cell: (h) => <span className="tabular-nums">{formatDataHora(h.enviadoEm)}</span>,
    },
    {
      id: 'numero',
      header: 'OS',
      className: 'w-28 font-mono text-xs',
      cell: (h) => h.ordemNumero,
    },
    {
      id: 'telefone',
      header: 'Destino',
      className: 'w-44',
      cell: (h) => <span className="tabular-nums">{formatTelefone(h.telefoneDestino)}</span>,
    },
    {
      id: 'anexo',
      header: 'Anexo',
      className: 'w-20',
      cell: (h) =>
        h.comAnexo ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="h-3 w-3" />
            PDF
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      className: 'w-32',
      cell: (h) =>
        h.sucesso ? (
          <Badge className="bg-success-soft text-success-foreground">
            <CheckCircle2 className="h-3 w-3" />
            Enviado
          </Badge>
        ) : (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3" />
            Falha
          </Badge>
        ),
    },
    {
      id: 'erro',
      header: 'Mensagem de erro',
      cell: (h) =>
        h.sucesso ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span
            className="line-clamp-2 cursor-help text-sm text-destructive"
            title={h.erroMensagem ?? ''}
          >
            {h.erroMensagem ?? '(sem detalhe)'}
          </span>
        ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cobranças via WhatsApp"
        description="Histórico de envios automáticos e manuais. Hover na linha de falha para ver o erro completo."
        actions={
          <Can permission="cobrancas.disparar">
            <ConfirmDialog
              trigger={
                <Button disabled={disparar.isPending}>
                  <Send className="h-4 w-4" />
                  Disparar agora
                </Button>
              }
              title="Disparar a rotina de cobrança?"
              description={
                <span className="space-y-2">
                  <span className="block">
                    Roda o mesmo serviço do agendador diário. Selecionará todas as OSs
                    concluídas com saldo devedor cuja data de vencimento já passou (ou é hoje)
                    e cujos clientes estão ativos.
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    A regra de idempotência garante no máximo 1 envio bem-sucedido por OS por
                    dia — disparar agora não duplica mensagens que já foram enviadas.
                  </span>
                </span>
              }
              confirmLabel="Disparar"
              pending={disparar.isPending}
              onConfirm={async () => {
                try {
                  const resultado = await disparar.mutateAsync()
                  const enviadas = resultado.enviadas ?? 0
                  const falhas = resultado.falhas ?? 0
                  const ignoradas = resultado.ignoradas ?? 0
                  const verificadas = resultado.ordensVerificadas ?? 0
                  toast.success(
                    `Rotina executada: ${enviadas} enviada(s), ${falhas} falha(s), ${ignoradas} ignorada(s) — ${verificadas} OS verificada(s).`,
                  )
                } catch (err) {
                  const apiErr = err as { message?: string }
                  toast.error(apiErr.message ?? 'Não foi possível disparar a rotina.')
                }
              }}
            />
          </Can>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={somenteFalhas}
            onChange={(e) => setFilter('falhas', e.target.checked)}
          />
          Somente falhas
        </label>
        {ordemServicoId && (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filtrando OS:</span>
            <span className="font-mono text-xs">#{ordemServicoId}</span>
            <Button variant="ghost" size="sm" onClick={() => setFilter('ordem', null)}>
              Limpar
            </Button>
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.dados}
        loading={isLoading}
        rowKey={(h) => h.id ?? `hist-${h.enviadoEm}`}
        onRowClick={(h) => navigate(`/ordens/${h.ordemServicoId}`)}
        empty={
          <EmptyState
            title={somenteFalhas ? 'Nenhuma falha registrada' : 'Histórico vazio'}
            description={
              somenteFalhas
                ? 'Boa notícia! Nenhuma cobrança falhou até agora.'
                : 'A rotina ainda não rodou ou nenhuma OS precisou de cobrança.'
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
