import { z } from 'zod'

/**
 * Schema zod espelhando `CriarVeiculoCommandValidator` / `AtualizarVeiculoCommandValidator`
 * no back:
 *  - ClienteId: > 0 (só usado na criação; na edição o dono é imutável)
 *  - Placa: obrigatória, formato antigo (AAA9999) ou Mercosul (AAA9A99)
 *  - Marca <= 50, Modelo <= 80, Cor <= 30, Observacoes <= 1000
 *  - AnoFabricacao / AnoModelo: 1900..2100 (opcionais)
 *  - Chassi: 17 alfanuméricos (opcional)
 *  - Renavam: 9..11 dígitos (opcional)
 *
 * A placa aceita hífen/minúsculas na digitação e é transformada para a forma
 * canônica (MAIÚSCULAS, sem separadores) antes de validar e enviar — o back
 * normaliza igual. Campos texto opcionais viram `null` quando vazios, para
 * casar com o back (mesma convenção de `clienteSchema`).
 */

// Forma canônica: só letras/dígitos, maiúsculas.
const canonicalizarPlaca = (v: string) =>
  v
    .split('')
    .filter((c) => /[a-zA-Z0-9]/.test(c))
    .join('')
    .toUpperCase()

// AAA9999 (antiga) ou AAA9A99 (Mercosul).
const PLACA_REGEX = /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} deve ter no máximo ${max} caracteres.`)
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional()

// Ano opcional: input vazio ('' ou null) → null; caso contrário coage para
// número inteiro entre 1900 e 2100. A ordem do union importa — '' precisa
// casar com o literal ANTES de `z.coerce.number()` (que transformaria '' em 0).
const optionalAno = z
  .union([z.literal(''), z.coerce.number()])
  .nullable()
  .optional()
  .transform((v) => (v === '' || v == null ? null : v))
  .refine(
    (v) => v == null || (Number.isInteger(v) && v >= 1900 && v <= 2100),
    'Ano inválido (use um valor entre 1900 e 2100).',
  )

export const veiculoSchema = z.object({
  clienteId: z.coerce
    .number({ invalid_type_error: 'Selecione um cliente.' })
    .int('Cliente inválido.')
    .positive('Selecione um cliente.'),
  placa: z
    .string()
    .trim()
    .min(1, 'Placa é obrigatória.')
    .transform(canonicalizarPlaca)
    .pipe(
      z
        .string()
        .regex(PLACA_REGEX, 'Placa inválida. Use o formato ABC1234 ou ABC1D23.'),
    ),
  marca: optionalText(50, 'Marca'),
  modelo: optionalText(80, 'Modelo'),
  anoFabricacao: optionalAno,
  anoModelo: optionalAno,
  cor: optionalText(30, 'Cor'),
  chassi: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{17}$/, 'Chassi deve ter 17 caracteres alfanuméricos.')
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  renavam: z
    .string()
    .trim()
    .regex(/^\d{9,11}$/, 'Renavam deve conter de 9 a 11 dígitos.')
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  observacoes: optionalText(1000, 'Observações'),
})

export type VeiculoFormValues = z.infer<typeof veiculoSchema>
