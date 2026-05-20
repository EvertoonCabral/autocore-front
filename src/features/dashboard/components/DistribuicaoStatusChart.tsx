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
import type { DistribuicaoStatusOsDto } from '@/api/types'

interface Props {
  statusOsAbertas: readonly DistribuicaoStatusOsDto[]
  loading?: boolean
}

/**
 * Cores combinam com `STATUS_ORDEM_META` (Aberta=blue, EmAndamento=amber,
 * AguardandoProduto=orange). Apenas status "em aberto" caem nesse gráfico —
 * Concluída/Cancelada são filtradas pelo back.
 */
const CORES: Record<number, string> = {
  1: '#3b82f6', // blue-500   — Aberta
  2: '#f59e0b', // amber-500  — Em andamento
  3: '#f97316', // orange-500 — Aguardando produto
}

const config: ChartConfig = {
  Aberta: { label: 'Aberta', color: CORES[1] ?? '' },
  EmAndamento: { label: 'Em andamento', color: CORES[2] ?? '' },
  AguardandoProduto: { label: 'Aguardando produto', color: CORES[3] ?? '' },
}

export function DistribuicaoStatusChart({ statusOsAbertas, loading = false }: Props) {
  const totalQuantidade = statusOsAbertas.reduce((acc, s) => acc + (s.quantidade ?? 0), 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Status das OSs em aberto</CardTitle>
        <CardDescription>Distribuição atual</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : statusOsAbertas.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground">
            Nenhuma OS em aberto no momento
          </div>
        ) : (
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <div className="relative h-56">
              <ChartContainer config={config} className="h-56 w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          `${value} OS${value === 1 ? '' : 's'}`
                        }
                      />
                    }
                  />
                  <Pie
                    data={[...statusOsAbertas]}
                    dataKey="quantidade"
                    nameKey="statusLabel"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {statusOsAbertas.map((s) => (
                      <Cell
                        key={`status-${s.status ?? 0}`}
                        fill={CORES[s.status ?? 0] ?? '#a1a1aa'}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums">{totalQuantidade}</span>
                <span className="text-xs text-muted-foreground">em aberto</span>
              </div>
            </div>

            <ul className="space-y-2 text-sm">
              {statusOsAbertas.map((s) => {
                const percent =
                  totalQuantidade > 0 ? ((s.quantidade ?? 0) / totalQuantidade) * 100 : 0
                return (
                  <li
                    key={`legenda-status-${s.status ?? 0}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: CORES[s.status ?? 0] ?? '#a1a1aa' }}
                      />
                      <span className="truncate">{s.statusLabel}</span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {s.quantidade} ({percent.toFixed(0)}%)
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
