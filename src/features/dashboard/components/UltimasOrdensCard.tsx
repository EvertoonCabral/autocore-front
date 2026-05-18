import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusOrdemBadge } from '@/shared/components/StatusOrdemBadge'
import { formatBRL } from '@/lib/format'
import type { OrdemServicoResumoDto } from '@/api/types'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'

interface Props {
  ordens: readonly OrdemServicoResumoDto[]
  loading?: boolean
}

export function UltimasOrdensCard({ ordens, loading = false }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Últimas ordens abertas</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {loading ? (
          <div className="space-y-2 px-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : ordens.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">
            Nenhuma OS aberta ainda.
          </p>
        ) : (
          <ul className="divide-y">
            {ordens.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/ordens/${o.id}`}
                  className="flex items-center justify-between gap-3 px-6 py-2 hover:bg-muted"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs">{o.numero}</span>
                    <span className="ml-2 truncate text-sm">{o.clienteNome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusOrdemBadge status={o.status as StatusOrdem | undefined} />
                    <span className="tabular-nums text-sm">
                      {formatBRL(o.totalGeral)}
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
