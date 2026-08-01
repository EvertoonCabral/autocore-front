import { z } from 'zod'

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} deve ter no máximo ${max} caracteres.`)
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional()

/**
 * Schema do POST /api/ordens. Espelha `AbrirOrdemServicoCommandValidator`:
 *  - ClienteId > 0
 *  - DescricaoProblema, Observacoes: opcionais, <= 1000 cada
 */
/** Veículo opcional na OS: número > 0 ou ausente (sem veículo vinculado). */
const optionalVeiculoId = z.coerce
  .number()
  .int()
  .positive()
  .optional()

export const abrirOrdemSchema = z.object({
  clienteId: z.coerce
    .number({ invalid_type_error: 'Selecione um cliente.' })
    .int('Cliente inválido.')
    .positive('Selecione um cliente.'),
  veiculoId: optionalVeiculoId,
  descricaoProblema: optionalText(1000, 'Descrição'),
  observacoes: optionalText(1000, 'Observações'),
})

export type AbrirOrdemFormValues = z.infer<typeof abrirOrdemSchema>

/** Schema do PUT /api/ordens/{id} — descricao, observacoes, status (não-final). */
export const atualizarOrdemSchema = z.object({
  veiculoId: optionalVeiculoId,
  descricaoProblema: optionalText(1000, 'Descrição'),
  observacoes: optionalText(1000, 'Observações'),
  status: z.coerce
    .number({ invalid_type_error: 'Status inválido.' })
    .int()
    .refine((v): v is 1 | 2 | 3 => [1, 2, 3].includes(v), 'Status inválido para edição.'),
})

export type AtualizarOrdemFormValues = z.infer<typeof atualizarOrdemSchema>

/** Schema do POST /api/ordens/{id}/servicos. */
export const adicionarItemServicoSchema = z.object({
  catalogoServicoId: z.coerce
    .number({ invalid_type_error: 'Selecione um serviço.' })
    .int()
    .positive('Selecione um serviço.'),
  quantidade: z.coerce
    .number({ invalid_type_error: 'Quantidade inválida.' })
    .int('Quantidade deve ser inteira.')
    .min(1, 'Quantidade deve ser pelo menos 1.'),
})

export type AdicionarItemServicoFormValues = z.infer<typeof adicionarItemServicoSchema>

/**
 * Schema do POST /api/ordens/{id}/produtos. Aceita produto cadastrado
 * (com `produtoId`) ou avulso (sem `produtoId` — exige nome e preço).
 */
export const adicionarItemProdutoSchema = z
  .object({
    produtoId: z.coerce.number().int().positive().optional(),
    nomeProduto: optionalText(150, 'Nome do produto'),
    precoUnitario: z.coerce
      .number({ invalid_type_error: 'Preço inválido.' })
      .min(0, 'Preço não pode ser negativo.')
      .optional(),
    quantidade: z.coerce
      .number({ invalid_type_error: 'Quantidade inválida.' })
      .int('Quantidade deve ser inteira.')
      .min(1, 'Quantidade deve ser pelo menos 1.'),
    produtoFornecidoPeloCliente: z.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    if (val.produtoId == null) {
      // Item avulso: exige nome e preço
      if (!val.nomeProduto) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o nome do produto avulso.',
          path: ['nomeProduto'],
        })
      }
      if (val.precoUnitario == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o preço do produto avulso.',
          path: ['precoUnitario'],
        })
      }
    }
  })

export type AdicionarItemProdutoFormValues = z.infer<typeof adicionarItemProdutoSchema>
