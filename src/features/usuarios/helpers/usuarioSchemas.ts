import { z } from 'zod'

/**
 * Schemas zod para o CRUD de usuários (Admin only).
 *
 * Espelham o que o back valida em `CriarUsuarioDtoValidator` /
 * `AtualizarUsuarioDtoValidator` + política do ASP.NET Identity. Aqui
 * cobrimos só o básico (tamanho/formato) — o resto (complexidade da senha,
 * email duplicado, etc.) vem como 422/400 do back.
 */

const ROLES = ['Admin', 'Operador'] as const

export const novoUsuarioSchema = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'E-mail é obrigatório.')
    .email('E-mail inválido.')
    .max(256, 'E-mail deve ter no máximo 256 caracteres.'),
  senha: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .max(100, 'Senha deve ter no máximo 100 caracteres.'),
  role: z.enum(ROLES, {
    errorMap: () => ({ message: 'Selecione uma role válida.' }),
  }),
})

export const editarUsuarioSchema = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.'),
  ativo: z.boolean(),
  /**
   * Vazio = não altera senha. Quando preenchida, mesma política do
   * `novoUsuarioSchema`.
   */
  novaSenha: z
    .string()
    .max(100, 'Senha deve ter no máximo 100 caracteres.')
    .refine((v) => v === '' || v.length >= 8, {
      message: 'Senha deve ter pelo menos 8 caracteres.',
    })
    .optional(),
})

export type NovoUsuarioFormValues = z.infer<typeof novoUsuarioSchema>
export type EditarUsuarioFormValues = z.infer<typeof editarUsuarioSchema>

export const ROLES_USUARIO = ROLES
