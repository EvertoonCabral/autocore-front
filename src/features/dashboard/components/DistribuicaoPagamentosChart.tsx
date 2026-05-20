import { Cell, Pie, PieChart } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatBRL } from '@/lib/format'
import type { DistribuicaoFormaPagamentoDto } from '@/api/types'

interface Props {
  pagamentos: readonly DistribuicaoFormaPagamentoDto[]
  loading?: boolean
}

/**
 * Mapa de cor por enum `FormaPagamento` (Dinheiro=1, Pix=2, Cartao=3,
 * Transferencia=4). Hex literal para garantir cor consistente em SVG.
 */
const CORES: Record<number, string> = {
  1: '#10b981', // emerald-500 — Dinheiro
  2: '#3b82f6', // blue-500    — Pix
  3: '#f59e0b', // amber-500   — Cartão
  4: '#8b5cf6', // violet-500  — Transferência
}

const config: ChartConfig = {
  Dinheiro: { label: 'Dinheiro', color: CORES[1] ?? '' },
  Pix: { label: 'Pix', color: CORES[2] ?? '' },
  Cartao: { label: 'Cartão', color: CORES[3] ?? '' },
  Transferencia: { label: 'Transferência', color: CORES[4] ?? '' },
}

export function DistribuicaoPagamentosChart({ pagamentos, loading = false }: Props) {
  const totalGeral = pagamentos.reduce((acc, p) => acc + (p.valor ?? 0), 0)
  const totalQuantidade = pagamentos.reduce((acc, p) => acc + (p.quantidade ?? 0), 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Formas de pagamento</CardTitle>
        <CardDescription>Distribuição do mês corrente</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : pagamentos.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground">
            Nenhum pagamento registrado este mês
          </div>
        ) : (
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <div className="relative h-56">
              <ChartContainer config={config} className="h-56 w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => {
                          const qtd =
                            (item.payload as { quantidade?: number } | undefined)?.quantidade ?? 0
                          return `${formatBRL(value)} · ${qtd} pgto${qtd === 1 ? '' : 's'}`
                        }}
                      />
                    }
                  />
                  <Pie
                    data={[...pagamentos]}
                    dataKey="valor"
                    nameKey="formaLabel"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {pagamentos.map((p) => (
                      <Cell
                        key={`forma-${p.forma ?? 0}`}
                        fill={CORES[p.forma ?? 0] ?? '#a1a1aa'}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold tabular-nums">
                  {formatBRL(totalGeral)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {totalQuantidade} pagamento{totalQuantidade === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <ul className="space-y-2 text-sm">
              {pagamentos.map((p) => {
                const percent = totalGeral > 0 ? ((p.valor ?? 0) / totalGeral) * 100 : 0
                return (
                  <li
                    key={`legenda-${p.forma ?? 0}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: CORES[p.forma ?? 0] ?? '#a1a1aa' }}
                      />
                      <span className="truncate">{p.formaLabel}</span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {percent.toFixed(0)}%
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
