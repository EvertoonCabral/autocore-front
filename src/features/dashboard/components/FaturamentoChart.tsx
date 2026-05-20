import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatBRL } from '@/lib/format'
import { useFaturamentoMensal } from '../hooks/useFaturamentoMensal'

const OPCOES = [
  { value: '1', label: '1 mês' },
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
] as const

const config: ChartConfig = {
  total: {
    label: 'Faturamento',
    color: '#F97316', // Tailwind orange-500 (paleta do projeto)
  },
}

export function FaturamentoChart() {
  const [meses, setMeses] = useState<number>(6)
  const { data, isLoading, isError } = useFaturamentoMensal(meses)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Faturamento</CardTitle>
          <CardDescription>Receita mensal recebida</CardDescription>
        </div>
        <Select value={String(meses)} onValueChange={(v) => setMeses(Number(v))}>
          <SelectTrigger className="h-8 w-[120px]" aria-label="Período">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCOES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <p className="py-12 text-center text-sm text-destructive" role="alert">
            Não foi possível carregar o faturamento.
          </p>
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <BarChart data={data ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="mesLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
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
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatBRL(value)}
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
        )}
      </CardContent>
    </Card>
  )
}
