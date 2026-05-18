import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { formatBRL, formatData, formatTelefone } from '@/lib/format'
import type { OrdemPendenteDto } from '@/api/types'

interface Props {
  pendencias: readonly OrdemPendenteDto[]
  loading?: boolean
}

export function PendenciasAntigasCard({ pendencias, loading = false }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pendências mais antigas</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {loading ? (
          <div className="space-y-2 px-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : pendencias.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">
            Nenhuma pendência em aberto.
          </p>
        ) : (
          <ul className="divide-y">
            {pendencias.map((p) => (
              <li key={p.ordemServicoId}>
                <Link
                  to={`/ordens/${p.ordemServicoId}`}
                  className="flex flex-col gap-1 px-6 py-2 hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{p.numero}</span>
                      <span className="truncate text-sm">{p.clienteNome}</span>
                      {p.vencida ? (
                        <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                          Vencida
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTelefone(p.clienteTelefone)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs text-muted-foreground">
                      {p.dataVencimentoPagamento
                        ? `vence ${formatData(p.dataVencimentoPagamento)}`
                        : 'sem vencimento'}
                    </span>
                    <span
                      className={cn(
                        'tabular-nums text-sm font-medium',
                        p.vencida && 'text-destructive',
                      )}
                    >
                      {formatBRL(p.saldoDevedor)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
