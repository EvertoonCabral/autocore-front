import { Navigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState } from '@/shared/components/EmptyState'
import { useCan } from '@/shared/components/Can'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { formatBRL } from '@/lib/format'
import { useResumoFinanceiro } from '../hooks/useResumoFinanceiro'
import { PeriodoFiltro } from '../components/PeriodoFiltro'
import { BaixarCsvButton } from '../components/BaixarCsvButton'

export function ResumoFinanceiroPage() {
  const podeVer = useCan('relatorios.ver')
  const { filters, setFilter } = usePagedQuery()

  const de = filters.de ?? ''
  const ate = filters.ate ?? ''

  const { data, isLoading, isError } = useResumoFinanceiro(
    {
      ...(de ? { de } : {}),
      ...(ate ? { ate } : {}),
    },
    { enabled: podeVer },
  )

  if (!podeVer) return <Navigate to="/" replace />

  const aging = data?.aging ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Resumo financeiro"
        description="Recebido, faturado e a receber no período, com o aging das pendências em aberto."
      />

      <PeriodoFiltro
        de={de}
        ate={ate}
        onChange={(key, value) => setFilter(key, value)}
        extra={
          <div className="flex items-end">
            <BaixarCsvButton
              params={{
                path: '/api/relatorios/resumo-financeiro/csv',
                query: {
                  ...(de ? { de } : {}),
                  ...(ate ? { ate } : {}),
                },
                defaultFilename: 'resumo-financeiro.csv',
              }}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Recebido"
          value={formatBRL(data?.recebido)}
          variant="success"
          loading={isLoading}
        />
        <KpiCard
          title="Faturado"
          value={formatBRL(data?.faturado)}
          variant="info"
          loading={isLoading}
        />
        <KpiCard
          title="A receber"
          value={formatBRL(data?.aReceber)}
          variant="warning"
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aging das pendências</CardTitle>
          <CardDescription>Saldo em aberto agrupado por faixa de atraso</CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-sm text-destructive" role="alert">
              Não foi possível carregar o resumo financeiro.
            </p>
          ) : !isLoading && aging.length === 0 ? (
            <EmptyState
              title="Nenhuma pendência"
              description="Não há saldo em aberto no período selecionado."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faixa</TableHead>
                    <TableHead className="w-28 text-right">Quantidade</TableHead>
                    <TableHead className="w-40 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aging.map((f) => (
                    <TableRow key={`aging-${f.faixa ?? ''}`}>
                      <TableCell>{f.faixa ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {f.quantidade ?? 0}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(f.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
