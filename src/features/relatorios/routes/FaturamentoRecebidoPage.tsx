import { Navigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/shared/components/PageHeader'
import { useCan } from '@/shared/components/Can'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { formatBRL } from '@/lib/format'
import { useFaturamentoRecebido } from '../hooks/useFaturamentoRecebido'
import { PeriodoFiltro } from '../components/PeriodoFiltro'
import { BaixarCsvButton } from '../components/BaixarCsvButton'
import { FaturamentoDiaChart } from '../components/FaturamentoDiaChart'
import { FaturamentoFormaDonut } from '../components/FaturamentoFormaDonut'

const TODAS = '__todas__'

const FORMA_OPCOES = [
  { value: '1', label: 'Dinheiro' },
  { value: '2', label: 'Pix' },
  { value: '3', label: 'Cartão' },
  { value: '4', label: 'Transferência' },
] as const

export function FaturamentoRecebidoPage() {
  const podeVer = useCan('relatorios.ver')
  const { filters, setFilter } = usePagedQuery()

  const de = filters.de ?? ''
  const ate = filters.ate ?? ''
  const formaStr = filters.forma ?? ''
  const forma = formaStr ? (Number(formaStr) as 1 | 2 | 3 | 4) : undefined

  const { data, isLoading, isError } = useFaturamentoRecebido(
    {
      ...(de ? { de } : {}),
      ...(ate ? { ate } : {}),
      ...(forma != null ? { forma } : {}),
    },
    { enabled: podeVer },
  )

  if (!podeVer) return <Navigate to="/" replace />

  const porDia = data?.porDia ?? []
  const porForma = data?.porForma ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Faturamento recebido"
        description="Total recebido no período, com série diária e distribuição por forma de pagamento."
      />

      <PeriodoFiltro
        de={de}
        ate={ate}
        onChange={(key, value) => setFilter(key, value)}
        extra={
          <>
            <div className="space-y-1.5">
              <Label htmlFor="rel-forma">Forma de pagamento</Label>
              <Select
                value={formaStr === '' ? TODAS : formaStr}
                onValueChange={(v) => setFilter('forma', v === TODAS ? '' : v)}
              >
                <SelectTrigger id="rel-forma">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Todas</SelectItem>
                  {FORMA_OPCOES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <BaixarCsvButton
                params={{
                  path: '/api/relatorios/faturamento-recebido/csv',
                  query: {
                    ...(de ? { de } : {}),
                    ...(ate ? { ate } : {}),
                    ...(forma != null ? { forma } : {}),
                  },
                  defaultFilename: 'faturamento-recebido.csv',
                }}
              />
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Total recebido"
          value={formatBRL(data?.total)}
          variant="success"
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recebido por dia</CardTitle>
          <CardDescription>Série diária no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : isError ? (
            <p className="py-12 text-center text-sm text-destructive" role="alert">
              Não foi possível carregar o faturamento.
            </p>
          ) : porDia.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground">
              Nenhum recebimento no período
            </div>
          ) : (
            <FaturamentoDiaChart porDia={porDia} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Formas de pagamento</CardTitle>
          <CardDescription>Distribuição do recebido por forma</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : porForma.length === 0 ? (
            <div className="flex h-56 items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground">
              Nenhum pagamento no período
            </div>
          ) : (
            <div className="space-y-4">
              <FaturamentoFormaDonut porForma={porForma} />
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Forma</TableHead>
                      <TableHead className="w-28 text-right">Qtd</TableHead>
                      <TableHead className="w-40 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porForma.map((p) => (
                      <TableRow key={`linha-forma-${p.forma ?? 0}`}>
                        <TableCell>{p.formaLabel ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.quantidade ?? 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatBRL(p.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
