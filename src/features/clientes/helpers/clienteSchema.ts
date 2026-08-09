import { z } from 'zod'

/**
 * Schema zod espelhando `CriarClienteCommandValidator` no back:
 *  - Nome: 3..150
 *  - Telefone: somente dígitos, 10..13 (DDD + número, com ou sem DDI 55)
 *  - Email: formato válido se preenchido
 *  - CpfCnpj: 11 (CPF) ou 14 (CNPJ) dígitos se preenchido
 *  - Observacoes: até 1000 caracteres
 *
 * Os campos texto opcionais são transformados em `null` quando vazios para
 * casar com o back (que espera `null` em vez de string vazia).
 *
 * Telefone e CpfCnpj passam por `transform` que remove a máscara antes da
 * validação regex — o usuário digita "(45) 99992-5801" no input, mas o
 * schema valida e exporta "45999925801". Centraliza o stripping aqui em vez
 * de duplicá-lo na hora do submit.
 *
 * Endereço estruturado (cep, logradouro, numero, bairro, cidade, uf) e
 * `segundoTelefone` são todos opcionais. Ao informar um CEP válido, o form
 * preenche logradouro/bairro/cidade/uf automaticamente via ViaCEP.
 */
const stripNonDigits = (v: string) => v.replace(/\D/g, '')

/** Texto livre opcional que vira `null` quando vazio (convenção do back). */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} deve ter no máximo ${max} caracteres.`)
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional()

export const clienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.'),
  telefone: z
    .string()
    .trim()
    .transform(stripNonDigits)
    .pipe(
      z
        .string()
        .regex(
          /^\d{10,13}$/,
          'Telefone deve conter apenas dígitos (10 a 13 caracteres, com DDD).',
        ),
    ),
  email: z
    .string()
    .trim()
    .email('E-mail inválido.')
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  cpfCnpj: z
    .string()
    .trim()
    .transform(stripNonDigits)
    .pipe(
      z
        .string()
        .regex(
          /^\d{11}$|^\d{14}$/,
          'CPF/CNPJ deve conter 11 (CPF) ou 14 (CNPJ) dígitos.',
        )
        .or(z.literal('')),
    )
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  segundoTelefone: z
    .string()
    .trim()
    .transform(stripNonDigits)
    .pipe(
      z
        .string()
        .regex(
          /^\d{10,13}$/,
          'Telefone deve conter apenas dígitos (10 a 13 caracteres, com DDD).',
        )
        .or(z.literal('')),
    )
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  cep: z
    .string()
    .trim()
    .transform(stripNonDigits)
    .pipe(
      z
        .string()
        .regex(/^\d{8}$/, 'CEP deve conter 8 dígitos.')
        .or(z.literal('')),
    )
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  logradouro: optionalText(150, 'Logradouro'),
  numero: optionalText(20, 'Número'),
  bairro: optionalText(80, 'Bairro'),
  cidade: optionalText(80, 'Cidade'),
  uf: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(
      z
        .string()
        .regex(/^[A-Z]{2}$/, 'UF deve ter exatamente 2 letras.')
        .or(z.literal('')),
    )
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  observacoes: z
    .string()
    .trim()
    .max(1000, 'Observações deve ter no máximo 1000 caracteres.')
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
