import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/format'
import type { DashboardCaixaDto } from '@/api/types'
import { nomeMesPtBr } from '../helpers/nomeMes'

interface Props {
  caixa: DashboardCaixaDto | undefined
  loading?: boolean
}

/**
 * Caixa (design 1a) — recebido no mês, a receber (vencido vs. a vencer),
 * ticket médio e estoque abaixo do mínimo. Coluna estreita (320px) que
 * empilha abaixo de 1280px.
 */
export function CaixaCard({ caixa, loading = false }: Props) {
  const recebidoMes = caixa?.recebidoMes ?? 0
  const recebidoAnterior = caixa?.recebidoMesAnterior ?? 0
  const vencido = caixa?.aReceberVencido ?? 0
  const aVencer = caixa?.aReceberAVencer ?? 0
  const aReceber = vencido + aVencer
  const pctVencido = aReceber > 0 ? (vencido / aReceber) * 100 : 0
  const mesLabel = `${nomeMesPtBr(caixa?.mes)} de ${caixa?.ano ?? ''}`.trim()

  return (
    <Card className="w-full xl:w-80" role="group" aria-label="Caixa">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Caixa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recebido no mês */}
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recebido em {mesLabel}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-[32px] font-semibold leading-none tabular-nums text-success">
              {formatBRL(recebidoMes)}
            </p>
          )}
          {!loading && (
            <p className="text-xs text-muted-foreground">
              mês anterior: {formatBRL(recebidoAnterior)}
            </p>
          )}
        </div>

        <hr className="border-border-faint" />

        {/* A receber */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              A receber
            </p>
            {!loading && (
              <span className="text-sm font-semibold tabular-nums">{formatBRL(aReceber)}</span>
            )}
          </div>
          {!loading && (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle" aria-hidden>
                <div className="h-full bg-danger" style={{ width: `${pctVencido}%` }} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-danger">vencido {formatBRL(vencido)}</span>
                <span className="text-muted-foreground">a vencer {formatBRL(aVencer)}</span>
              </div>
            </>
          )}
        </div>

        <hr className="border-border-faint" />

        {/* Indicadores */}
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Ticket médio (6 meses)</dt>
            <dd className="font-medium tabular-nums">
              {loading ? '—' : formatBRL(caixa?.ticketMedio6m ?? 0)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Estoque abaixo do mínimo</dt>
            <dd className="font-medium tabular-nums">
              {loading ? (
                '—'
              ) : (
                <Link to="/produtos/abaixo-minimo" className="text-primary hover:underline">
                  {caixa?.estoqueAbaixoMinimo ?? 0}
                </Link>
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
