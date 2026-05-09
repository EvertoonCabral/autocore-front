import { cn } from '@/lib/cn'
import { STATUS_ORDEM_META, type StatusOrdem } from '@/shared/enums/statusOrdem'

interface Props {
  status: StatusOrdem | undefined | null
  className?: string
}

/** Badge colorido com label PT-BR do StatusOrdem. */
export function StatusOrdemBadge({ status, className }: Props) {
  if (status == null) return null
  const meta = STATUS_ORDEM_META[status]
  if (!meta) return null
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        meta.badgeClass,
        className,
      )}
    >
      {meta.label}
    </span>
  )
}
