/**
 * Enum `StatusIntencaoPagamento` do back (numérico):
 *   Pendente=1, Aprovada=2, Recusada=3, Expirada=4, Cancelada=5, Reembolsada=6
 */

export type StatusIntencaoPagamento = 1 | 2 | 3 | 4 | 5 | 6

export const StatusIntencaoValues = {
  Pendente: 1,
  Aprovada: 2,
  Recusada: 3,
  Expirada: 4,
  Cancelada: 5,
  Reembolsada: 6,
} as const satisfies Record<string, StatusIntencaoPagamento>

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

interface StatusMeta {
  label: string
  variant: BadgeVariant
}

export const STATUS_INTENCAO_META: Record<StatusIntencaoPagamento, StatusMeta> = {
  1: { label: 'Aguardando pagamento', variant: 'secondary' },
  2: { label: 'Aprovado', variant: 'default' },
  3: { label: 'Recusado', variant: 'destructive' },
  4: { label: 'Expirado', variant: 'outline' },
  5: { label: 'Cancelado', variant: 'outline' },
  6: { label: 'Reembolsado', variant: 'destructive' },
}

export function statusIntencaoLabel(
  value: StatusIntencaoPagamento | number | null | undefined,
): string {
  if (value == null) return ''
  return STATUS_INTENCAO_META[value as StatusIntencaoPagamento]?.label ?? `Status ${value}`
}

export function statusIntencaoVariant(
  value: StatusIntencaoPagamento | number | null | undefined,
): BadgeVariant {
  if (value == null) return 'secondary'
  return STATUS_INTENCAO_META[value as StatusIntencaoPagamento]?.variant ?? 'secondary'
}

/** Status terminais — o polling deve parar. */
export function statusIntencaoTerminal(
  value: StatusIntencaoPagamento | number | null | undefined,
): boolean {
  return value != null && value !== StatusIntencaoValues.Pendente
}
