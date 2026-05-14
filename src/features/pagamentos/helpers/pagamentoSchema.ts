import { z } from 'zod'
import { FormaPagamentoValues } from '@/shared/enums/formaPagamento'

/**
 * Schema do POST /api/pagamentos. Espelha `RegistrarPagamentoCommand` no back:
 *  - OrdemServicoId > 0
 *  - Valor > 0
 *  - Forma: enum 1..4
 *  - Observacao: opcional, máx 300
 *
 * O limite `valor <= saldoDevedor` é validado de forma dinâmica pelo caller
 * (depende do saldo atual da OS) — ver `pagamentoSchemaComSaldo`.
 */
export const pagamentoBaseSchema = z.object({
  valor: z.coerce
    .number({ invalid_type_error: 'Valor inválido.' })
    .positive('Valor deve ser maior que zero.')
    .max(9_999_999.99, 'Valor fora do limite.'),
  forma: z.coerce
    .number({ invalid_type_error: 'Forma inválida.' })
    .int()
    .refine(
      (v): v is 1 | 2 | 3 | 4 =>
        v === FormaPagamentoValues.Dinheiro ||
        v === FormaPagamentoValues.Pix ||
        v === FormaPagamentoValues.Cartao ||
        v === FormaPagamentoValues.Transferencia,
      'Forma de pagamento inválida.',
    ),
  observacao: z
    .string()
    .trim()
    .max(300, 'Observação deve ter no máximo 300 caracteres.')
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
})

export type PagamentoFormValues = z.infer<typeof pagamentoBaseSchema>

/**
 * Builder que adiciona a regra "valor <= saldoDevedor" — usado no dialog
 * de registrar pagamento, onde temos acesso ao saldo atual da OS.
 */
export function pagamentoSchemaComSaldo(saldoDevedor: number) {
  return pagamentoBaseSchema.extend({
    valor: pagamentoBaseSchema.shape.valor.refine(
      (v) => v <= saldoDevedor + 0.001, // tolerância para arredondamento
      `Valor excede o saldo devedor (${saldoDevedor.toFixed(2)}).`,
    ),
  })
}
