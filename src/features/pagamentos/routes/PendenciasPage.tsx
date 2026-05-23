import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pagination } from '@/shared/components/Pagination'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { BadgeVencimento } from '@/shared/components/BadgeVencimento'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import { formatBRL, formatTelefone } from '@/lib/format'
import type { OrdemPendenteDto } from '@/api/types'
import { useListarPendencias } from '../hooks/useListarPendencias'
import { CobrarOrdemButton } from '@/features/cobrancas/components/CobrarOrdemButton'

export function PendenciasPage() {
  const navigate = useNavigate()
  const { pagina, porPagina, filters, setPagina, setPorPagina, setFilter } = usePagedQuery({
    porPagina: 20,
  })

  const somenteVencidas = filters.vencidas === 'true'

  const { data, isLoading } = useListarPendencias({
    pagina,
    porPagina,
    somenteVencidas,
  })

  const columns: ColumnDef<OrdemPendenteDto>[] = [
    {
      id: 'numero',
      header: 'OS',
      className: 'w-28 font-mono text-xs',
      cell: (p) => p.numero,
    },
    {
      id: 'cliente',
      header: 'Cliente',
      cell: (p) => (
        <div className="flex flex-col">
          <span className="font-medium">{p.clienteNome}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTelefone(p.clienteTelefone)}
          </span>
        </div>
      ),
    },
    {
      id: 'vencimento',
      header: 'Vencimento',
      className: 'w-32',
      cell: (p) => (
        <BadgeVencimento
          dataVencimento={p.dataVencimentoPagamento}
          vencida={p.vencida ?? false}
        />
      ),
    },
    {
      id: 'totalGeral',
      header: <span className="text-right">Total</span>,
      className: 'w-32 text-right',
      cell: (p) => <span className="tabular-nums">{formatBRL(p.totalGeral ?? 0)}</span>,
    },
    {
      id: 'pago',
      header: <span className="text-right">Pago</span>,
      className: 'w-32 text-right',
      cell: (p) => (
        <span className="tabular-nums text-muted-foreground">{formatBRL(p.totalPago ?? 0)}</span>
      ),
    },
    {
      id: 'saldo',
      header: <span className="text-right">Saldo</span>,
      className: 'w-32 text-right',
      cell: (p) => (
        <span className="tabular-nums font-medium text-destructive">
          {formatBRL(p.saldoDevedor ?? 0)}
        </span>
      ),
    },
    {
      id: 'acoes',
      header: <span className="sr-only">Ações</span>,
      className: 'w-32 text-right',
      cell: (p) => (
        <div
          className="flex justify-end"
          // role="presentation" + stop propagation evita que o clique do botão
          // navegue para /ordens/:id (a linha inteira é clicável).
          role="presentation"
          onClick={(e) => e.stopPropagation()}
        >
          <CobrarOrdemButton
            ordemServicoId={p.ordemServicoId ?? 0}
            numero={p.numero ?? ''}
            clienteNome={p.clienteNome ?? ''}
            clienteTelefone={p.clienteTelefone ?? ''}
            saldoDevedor={p.saldoDevedor ?? 0}
            dataVencimento={p.dataVencimentoPagamento}
            vencida={p.vencida ?? false}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pendências"
        description="OSs concluídas com saldo devedor — clientes que devem ser cobrados."
      />

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={somenteVencidas}
          onChange={(e) => setFilter('vencidas', e.target.checked)}
        />
        Somente vencidas
      </label>

      <DataTable
        columns={columns}
        data={data?.dados}
        loading={isLoading}
        rowKey={(p) => p.ordemServicoId ?? `pen-${p.numero}`}
        onRowClick={(p) => navigate(`/ordens/${p.ordemServicoId}`)}
        empty={
          <EmptyState
            title={somenteVencidas ? 'Nenhuma pendência vencida' : 'Nenhuma pendência'}
            description={
              somenteVencidas
                ? 'Boa notícia! Nenhuma OS está com prazo de pagamento vencido.'
                : 'Todas as OSs concluídas estão quitadas.'
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
