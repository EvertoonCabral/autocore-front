import { z } from 'zod'

/**
 * Schema zod espelhando `CriarClienteCommandValidator` no back:
 *  - Nome: 3..150
 *  - Telefone: somente dígitos, 10..13 (DDD + número, com ou sem DDI 55)
 *  - Email: formato válido se preenchido
 *  - Cpf: exatamente 11 dígitos se preenchido
 *  - Endereco: livre, opcional
 */
export const clienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.'),
  telefone: z
    .string()
    .trim()
    .regex(/^\d{10,13}$/, 'Telefone deve conter apenas dígitos (10 a 13 caracteres, com DDD).'),
  email: z
    .string()
    .trim()
    .email('E-mail inválido.')
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  cpf: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'CPF deve conter exatamente 11 dígitos.')
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  endereco: z
    .string()
    .trim()
    .max(500, 'Endereço deve ter no máximo 500 caracteres.')
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
