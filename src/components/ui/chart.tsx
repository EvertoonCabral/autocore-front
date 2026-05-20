/**
 * Chart primitives — wrapper Tailwind-friendly em torno do Recharts.
 *
 * Versão simplificada do componente shadcn/ui `chart`, com os ajustes
 * mínimos para passar no nosso `tsconfig` estrito (incluindo
 * `exactOptionalPropertyTypes`). Expõe:
 *
 *   - `<ChartContainer config={...}>` — wrapper responsivo + injeção de
 *     CSS vars `--color-<key>` a partir do `config`.
 *   - `<ChartTooltip>` — re-exporta `Tooltip` do Recharts.
 *   - `<ChartTooltipContent>` — conteúdo customizado do tooltip.
 *   - `<ChartLegend>` / `<ChartLegendContent>` — legenda customizada.
 *
 * Mantém o contrato visual do shadcn (cores via CSS vars), mas evita
 * spreads `unknown` e tipos `any` que o nosso ESLint reprovaria.
 */
import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/cn'

// ─── Config / Context ─────────────────────────────────────────────────────

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
>

interface ChartContextValue {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error('useChart deve ser usado dentro de <ChartContainer>.')
  return ctx
}

// ─── Container ────────────────────────────────────────────────────────────

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactElement
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId()
    const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={chartId}
          ref={ref}
          className={cn(
            "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
            className,
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  },
)
ChartContainer.displayName = 'ChartContainer'

/** Injeta variáveis CSS `--color-<key>` baseadas em `config[key].color`. */
function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => Boolean(item.color))
  if (colorConfig.length === 0) return null

  const css = `[data-chart=${id}] {\n${colorConfig
    .map(([key, item]) => `  --color-${key}: ${item.color ?? ''};`)
    .join('\n')}\n}`

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

// ─── Tooltip ──────────────────────────────────────────────────────────────

export const ChartTooltip = RechartsPrimitive.Tooltip

interface TooltipPayloadItem {
  value?: number | string
  name?: string
  dataKey?: string | number
  color?: string
  payload?: Record<string, unknown>
}

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: React.ReactNode
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: 'line' | 'dot' | 'dashed'
  nameKey?: string
  labelKey?: string
  /** Formatter de valor — recebe o valor numérico bruto e devolve o texto. */
  formatter?: (value: number, name: string, item: TooltipPayloadItem) => React.ReactNode
  /** Formatter do label (linha superior). */
  labelFormatter?: (label: React.ReactNode, payload: TooltipPayloadItem[]) => React.ReactNode
}

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      formatter,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart()

    if (!active || !payload?.length) return null

    const nestLabel = payload.length === 1 && indicator !== 'dot'

    const tooltipLabel = (() => {
      if (hideLabel || !payload?.length) return null
      const [item] = payload
      if (!item) return null
      const key = labelKey ?? item.dataKey?.toString() ?? item.name ?? 'value'
      const itemConfig = config[key]
      const value = itemConfig?.label ?? label
      if (labelFormatter) {
        return <div className="font-medium">{labelFormatter(value, payload)}</div>
      }
      if (!value) return null
      return <div className="font-medium">{value}</div>
    })()

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className,
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, idx) => {
            const key = nameKey ?? item.name ?? item.dataKey?.toString() ?? 'value'
            const itemConfig = config[key]
            const indicatorColor = item.color ?? itemConfig?.color
            const rawValue = typeof item.value === 'number' ? item.value : Number(item.value ?? 0)
            const displayValue = formatter
              ? formatter(rawValue, key, item)
              : item.value

            return (
              <div
                key={String(item.dataKey ?? idx)}
                className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground"
              >
                {!hideIndicator ? (
                  <div
                    className={cn('shrink-0 rounded-[2px]', {
                      'h-2.5 w-2.5': indicator === 'dot',
                      'w-1': indicator === 'line',
                      'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                    })}
                    style={{
                      backgroundColor: indicator !== 'dashed' ? indicatorColor : undefined,
                      borderColor: indicator === 'dashed' ? indicatorColor : undefined,
                    }}
                  />
                ) : null}
                <div
                  className={cn('flex flex-1 justify-between leading-none', {
                    'items-end': nestLabel,
                    'items-center': !nestLabel,
                  })}
                >
                  <div className="grid gap-1.5">
                    {nestLabel ? tooltipLabel : null}
                    <span className="text-muted-foreground">{itemConfig?.label ?? key}</span>
                  </div>
                  {displayValue !== undefined && displayValue !== null ? (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {displayValue as React.ReactNode}
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = 'ChartTooltipContent'

// ─── Legend ───────────────────────────────────────────────────────────────

export const ChartLegend = RechartsPrimitive.Legend

interface LegendPayloadItem {
  value?: string
  dataKey?: string | number
  color?: string
  payload?: Record<string, unknown>
}

interface ChartLegendContentProps extends React.HTMLAttributes<HTMLDivElement> {
  payload?: LegendPayloadItem[]
  hideIcon?: boolean
  nameKey?: string
  verticalAlign?: 'top' | 'middle' | 'bottom'
}

export const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey }, ref) => {
    const { config } = useChart()

    if (!payload?.length) return null

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-4',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className,
        )}
      >
        {payload.map((item) => {
          const key = nameKey ?? item.dataKey?.toString() ?? item.value ?? 'value'
          const itemConfig = config[key]
          return (
            <div key={String(item.value ?? item.dataKey)} className="flex items-center gap-1.5">
              {!hideIcon ? (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
              ) : null}
              <span className="text-muted-foreground">{itemConfig?.label ?? item.value}</span>
            </div>
          )
        })}
      </div>
    )
  },
)
ChartLegendContent.displayName = 'ChartLegendContent'
