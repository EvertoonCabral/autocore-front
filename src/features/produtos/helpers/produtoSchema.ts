import { z } from 'zod'

/**
 * Schema zod espelhando `CriarProdutoCommandValidator` no back:
 *  - Nome: 2..150
 *  - Referencia: opcional, <= 100
 *  - PrecoCusto, PrecoVenda: >= 0
 *  - QuantidadeEstoque, EstoqueMinimo: int >= 0
 */
export const produtoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.'),
  referencia: z
    .string()
    .trim()
    .max(100, 'Referência deve ter no máximo 100 caracteres.')
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  precoCusto: z.coerce
    .number({ invalid_type_error: 'Preço de custo inválido.' })
    .min(0, 'Preço de custo não pode ser negativo.')
    .max(9_999_999.99, 'Preço de custo fora do limite.'),
  precoVenda: z.coerce
    .number({ invalid_type_error: 'Preço de venda inválido.' })
    .min(0, 'Preço de venda não pode ser negativo.')
    .max(9_999_999.99, 'Preço de venda fora do limite.'),
  quantidadeEstoque: z.coerce
    .number({ invalid_type_error: 'Quantidade inválida.' })
    .int('Quantidade deve ser um número inteiro.')
    .min(0, 'Quantidade não pode ser negativa.'),
  estoqueMinimo: z.coerce
    .number({ invalid_type_error: 'Estoque mínimo inválido.' })
    .int('Estoque mínimo deve ser um número inteiro.')
    .min(0, 'Estoque mínimo não pode ser negativo.'),
})

export type ProdutoFormValues = z.infer<typeof produtoSchema>

/**
 * Schema do PATCH /estoque — aceita inteiros positivos (entrada) ou
 * negativos (saída), exceto zero. A regra "saldo final >= 0" é validada
 * no front com base no estoque atual (passado pelo caller).
 */
export const ajustarEstoqueSchema = z.object({
  quantidade: z.coerce
    .number({ invalid_type_error: 'Quantidade inválida.' })
    .int('Quantidade deve ser um número inteiro.')
    .refine((v) => v !== 0, 'Quantidade não pode ser zero.'),
})

export type AjustarEstoqueFormValues = z.infer<typeof ajustarEstoqueSchema>
