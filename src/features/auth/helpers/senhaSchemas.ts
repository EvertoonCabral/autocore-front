import { z } from 'zod'

/** Política mínima de senha no front (o back valida a política completa). */
const novaSenha = z.string().min(8, 'A senha deve ter ao menos 8 caracteres.')

// ─── Esqueci minha senha ─────────────────────────────────────────────────────
export const esqueciSenhaSchema = z.object({
  email: z
    .string()
    .min(1, 'Informe o e-mail.')
    .email('Formato de e-mail inválido.'),
})

export type EsqueciSenhaFormValues = z.infer<typeof esqueciSenhaSchema>

// ─── Redefinir senha (link do e-mail) ────────────────────────────────────────
export const redefinirSenhaSchema = z
  .object({
    novaSenha,
    confirmar: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((v) => v.novaSenha === v.confirmar, {
    message: 'As senhas não conferem.',
    path: ['confirmar'],
  })

export type RedefinirSenhaFormValues = z.infer<typeof redefinirSenhaSchema>

// ─── Trocar a própria senha (autenticado) ────────────────────────────────────
export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual.'),
    novaSenha,
    confirmar: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((v) => v.novaSenha === v.confirmar, {
    message: 'As senhas não conferem.',
    path: ['confirmar'],
  })

export type TrocarSenhaFormValues = z.infer<typeof trocarSenhaSchema>
