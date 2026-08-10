/** Enum `ModalidadeCobranca` do back: Quitacao=1, Adiantamento=2. */

export type ModalidadeCobranca = 1 | 2

export const ModalidadeValues = {
  Quitacao: 1,
  Adiantamento: 2,
} as const satisfies Record<string, ModalidadeCobranca>

export function modalidadeLabel(value: ModalidadeCobranca | number | null | undefined): string {
  if (value === ModalidadeValues.Quitacao) return 'Quitação'
  if (value === ModalidadeValues.Adiantamento) return 'Adiantamento'
  return ''
}

/** Enum `OrigemCobranca` do back: Bancada=1, Remota=2. */
export type OrigemCobranca = 1 | 2
export const OrigemValues = {
  Bancada: 1,
  Remota: 2,
} as const satisfies Record<string, OrigemCobranca>
