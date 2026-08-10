import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatBRL, formatData } from '@/lib/format'
import type { FaturamentoDiaDto } from '@/api/types'

interface Props {
  porDia: readonly FaturamentoDiaDto[]
}

const config: ChartConfig = {
  total: {
    label: 'Recebido',
    color: 'hsl(var(--chart-1))', // accent do tenant (segue tema + Aparência)
  },
}

/** Barras de faturamento recebido por dia. */
export function FaturamentoDiaChart({ porDia }: Props) {
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={[...porDia]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="dia"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          tickFormatter={(value: string) => formatData(value)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          tickFormatter={(value: number) =>
            value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
          }
        />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--foreground) / 0.05)' }}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => formatData(String(label))}
              formatter={(value) => formatBRL(Number(value))}
              hideIndicator={false}
            />
          }
        />
        <Bar
          dataKey="total"
          fill="var(--color-total)"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}
