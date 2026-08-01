import { Cell, Pie, PieChart } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatBRL } from '@/lib/format'
import type { FaturamentoPorFormaDto } from '@/api/types'

interface Props {
  porForma: readonly FaturamentoPorFormaDto[]
}

/**
 * Cor por enum `FormaPagamento` (Dinheiro=1, Pix=2, Cartao=3,
 * Transferencia=4). Mesma paleta do donut do dashboard.
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

/** Donut da distribuição do faturamento por forma de pagamento. */
export function FaturamentoFormaDonut({ porForma }: Props) {
  const totalGeral = porForma.reduce((acc, p) => acc + (p.total ?? 0), 0)

  return (
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
                    return `${formatBRL(Number(value))} · ${qtd} pgto${qtd === 1 ? '' : 's'}`
                  }}
                />
              }
            />
            <Pie
              data={[...porForma]}
              dataKey="total"
              nameKey="formaLabel"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {porForma.map((p) => (
                <Cell key={`forma-${p.forma ?? 0}`} fill={CORES[p.forma ?? 0] ?? '#a1a1aa'} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold tabular-nums">{formatBRL(totalGeral)}</span>
          <span className="text-xs text-muted-foreground">recebido</span>
        </div>
      </div>

      <ul className="space-y-2 text-sm">
        {porForma.map((p) => {
          const percent = totalGeral > 0 ? ((p.total ?? 0) / totalGeral) * 100 : 0
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
              <span className="tabular-nums text-muted-foreground">{percent.toFixed(0)}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
