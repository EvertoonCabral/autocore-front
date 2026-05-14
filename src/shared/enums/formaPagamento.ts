/**
 * Mapeamento do enum `FormaPagamento` do back (numérico, transmitido como int)
 * para label PT-BR e ícone visual.
 *
 * Valores vêm de `Domain/Enums/FormaPagamento.cs`:
 *   Dinheiro=1, Pix=2, Cartao=3, Transferencia=4
 */

export type FormaPagamento = 1 | 2 | 3 | 4

export const FormaPagamentoValues = {
  Dinheiro: 1,
  Pix: 2,
  Cartao: 3,
  Transferencia: 4,
} as const satisfies Record<string, FormaPagamento>

export type FormaPagamentoNome = keyof typeof FormaPagamentoValues

interface FormaMeta {
  nome: FormaPagamentoNome
  label: string
  /** Emoji ou letra curta para identificação visual rápida na tabela. */
  marca: string
}

export const FORMA_PAGAMENTO_META: Record<FormaPagamento, FormaMeta> = {
  1: { nome: 'Dinheiro', label: 'Dinheiro', marca: '💵' },
  2: { nome: 'Pix', label: 'Pix', marca: 'Px' },
  3: { nome: 'Cartao', label: 'Cartão', marca: '💳' },
  4: { nome: 'Transferencia', label: 'Transferência', marca: '🔁' },
}

/** Opções para `<Select>`. */
export const FORMA_PAGAMENTO_OPTIONS: Array<{ value: FormaPagamento; label: string }> = [
  { value: 1, label: 'Dinheiro' },
  { value: 2, label: 'Pix' },
  { value: 3, label: 'Cartão' },
  { value: 4, label: 'Transferência' },
]

export function formaPagamentoLabel(value: FormaPagamento | number | null | undefined): string {
  if (value == null) return ''
  return FORMA_PAGAMENTO_META[value as FormaPagamento]?.label ?? `Forma ${value}`
}
