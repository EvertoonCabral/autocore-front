import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

export type KpiVariant = 'default' | 'info' | 'warning' | 'destructive' | 'success'

interface KpiCardProps {
  title: string
  /** Valor principal — número, BRL formatado, etc. */
  value?: ReactNode
  /** Texto secundário pequeno, abaixo do valor. */
  sub?: ReactNode
  /** Ícone opcional no header. */
  icon?: ReactNode
  variant?: KpiVariant
  loading?: boolean
}

const variantBorder: Record<KpiVariant, string> = {
  default: 'border-l-zinc-300 dark:border-l-zinc-700',
  info: 'border-l-blue-500',
  warning: 'border-l-amber-500',
  destructive: 'border-l-red-500',
  success: 'border-l-emerald-500',
}

export function KpiCard({
  title,
  value,
  sub,
  icon,
  variant = 'default',
  loading = false,
}: KpiCardProps) {
  return (
    <Card className={cn('border-l-4', variantBorder[variant])}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 pt-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-semibold tabular-nums">
            {value ?? '-'}
          </div>
        )}
        {sub ? (
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
