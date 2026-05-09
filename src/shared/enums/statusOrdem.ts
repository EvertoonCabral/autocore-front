/**
 * Mapeamento do enum `StatusOrdem` do back (numérico, transmitido como int)
 * para metadados de UI: label PT-BR, variant do Badge, e regras de transição.
 *
 * Os valores numéricos vêm de `Domain/Enums/StatusOrdem.cs`:
 *   Aberta=1, EmAndamento=2, AguardandoProduto=3, Concluida=4, Cancelada=5
 */

export type StatusOrdem = 1 | 2 | 3 | 4 | 5

export const StatusOrdemValues = {
  Aberta: 1,
  EmAndamento: 2,
  AguardandoProduto: 3,
  Concluida: 4,
  Cancelada: 5,
} as const satisfies Record<string, StatusOrdem>

export type StatusOrdemNome = keyof typeof StatusOrdemValues

interface StatusMeta {
  nome: StatusOrdemNome
  label: string
  /** Tailwind classes para o badge (não usa variant porque precisa de cores específicas). */
  badgeClass: string
}

export const STATUS_ORDEM_META: Record<StatusOrdem, StatusMeta> = {
  1: {
    nome: 'Aberta',
    label: 'Aberta',
    badgeClass: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200',
  },
  2: {
    nome: 'EmAndamento',
    label: 'Em andamento',
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
  },
  3: {
    nome: 'AguardandoProduto',
    label: 'Aguardando produto',
    badgeClass: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200',
  },
  4: {
    nome: 'Concluida',
    label: 'Concluída',
    badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200',
  },
  5: {
    nome: 'Cancelada',
    label: 'Cancelada',
    badgeClass: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  },
}

/** Iterator para usar em `<Select>` de filtros. */
export const STATUS_ORDEM_OPTIONS: Array<{ value: StatusOrdem; label: string }> = [
  { value: 1, label: 'Aberta' },
  { value: 2, label: 'Em andamento' },
  { value: 3, label: 'Aguardando produto' },
  { value: 4, label: 'Concluída' },
  { value: 5, label: 'Cancelada' },
]

// ─── Regras de transição (espelham o back) ────────────────────────────────

/** OS pode ter itens adicionados/removidos? Espelha a regra de Edição. */
export function podeEditarItens(status: StatusOrdem | undefined | null): boolean {
  return status === 1 || status === 2
}

/** OS pode ter status mudado para o `novo` via PUT? */
export function podeMudarStatus(atual: StatusOrdem, novo: StatusOrdem): boolean {
  // Estados finais não podem ser alterados via PUT
  if (atual === 4 || atual === 5) return false
  // Concluida e Cancelada exigem endpoints dedicados (fechar/cancelar)
  if (novo === 4 || novo === 5) return false
  return true
}

/** OS pode ser fechada agora? */
export function podeFechar(status: StatusOrdem | undefined | null): boolean {
  return status === 1 || status === 2 || status === 3
}

/**
 * OS pode ser cancelada agora? Atenção: o back ainda rejeita o cancelamento
 * se houver pagamentos registrados em uma OS Concluída — o front avisa por
 * mensagem mas a verdade fica no back.
 */
export function podeCancelar(status: StatusOrdem | undefined | null): boolean {
  return status === 1 || status === 2 || status === 3
}

/** Status disponíveis para edição via PUT (exclui finais). */
export const STATUS_EDITAVEIS_OPTIONS: Array<{ value: StatusOrdem; label: string }> = [
  { value: 1, label: 'Aberta' },
  { value: 2, label: 'Em andamento' },
  { value: 3, label: 'Aguardando produto' },
]
