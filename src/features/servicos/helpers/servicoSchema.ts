import { z } from 'zod'

/**
 * Schema zod espelhando `CriarCatalogoServicoCommandValidator` /
 * `AtualizarCatalogoServicoCommandValidator` no back:
 *  - Nome: 3..150
 *  - Descricao: opcional, <= 500
 *  - Preco: >= 0
 *  - EhMaoDeObraPadrao: bool (apenas um pode ser true por vez — regra do back)
 */
export const servicoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.'),
  descricao: z
    .string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres.')
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  preco: z.coerce
    .number({ invalid_type_error: 'Preço inválido.' })
    .min(0, 'Preço não pode ser negativo.')
    .max(9_999_999.99, 'Preço fora do limite.'),
  ehMaoDeObraPadrao: z.boolean().default(false),
})

/** Schema do PATCH /preco — Admin only. */
export const precoSchema = z.object({
  preco: z.coerce
    .number({ invalid_type_error: 'Preço inválido.' })
    .min(0, 'Preço não pode ser negativo.')
    .max(9_999_999.99, 'Preço fora do limite.'),
})

export type ServicoFormValues = z.infer<typeof servicoSchema>
export type PrecoFormValues = z.infer<typeof precoSchema>
