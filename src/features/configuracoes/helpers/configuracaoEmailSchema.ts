import { z } from 'zod'

/**
 * Schema do form de edição da configuração SMTP
 * (`PUT /api/configuracoes/email`).
 *
 * Regras:
 * - `smtpHost`, `smtpPorta`, `smtpUsuario`, `emailRemetente`, `nomeRemetente`:
 *   obrigatórios.
 * - `smtpSenha`: opcional. Vazio = manter atual no back; preenchido = substituir.
 *   O front recebe apenas `smtpSenhaDefinida: bool`.
 * - `usarTls`: liga STARTTLS no SmtpClient.
 * - `usarStub`: quando ligado, o serviço só loga sem abrir conexão.
 * - `fallbackHabilitado`: liga o fallback automático no `CobrancaJobService`.
 */
export const configuracaoEmailSchema = z.object({
  smtpHost: z
    .string({ required_error: 'Informe o host SMTP.' })
    .trim()
    .min(1, 'Informe o host SMTP.')
    .max(200, 'Host muito longo (máx 200).'),
  smtpPorta: z
    .number({ required_error: 'Informe a porta SMTP.' })
    .int('A porta deve ser um inteiro.')
    .min(1, 'Porta deve ser ≥ 1.')
    .max(65535, 'Porta deve ser ≤ 65535.'),
  smtpUsuario: z
    .string({ required_error: 'Informe o usuário SMTP.' })
    .trim()
    .min(1, 'Informe o usuário SMTP.')
    .max(200, 'Usuário muito longo (máx 200).'),
  smtpSenha: z
    .string()
    .max(500, 'Senha muito longa (máx 500).')
    .optional()
    .default(''),
  emailRemetente: z
    .string({ required_error: 'Informe o e-mail remetente.' })
    .trim()
    .email('Informe um e-mail válido.')
    .max(200, 'E-mail muito longo (máx 200).'),
  nomeRemetente: z
    .string({ required_error: 'Informe o nome remetente.' })
    .trim()
    .min(1, 'Informe o nome remetente.')
    .max(150, 'Nome muito longo (máx 150).'),
  usarTls: z.boolean(),
  usarStub: z.boolean(),
  fallbackHabilitado: z.boolean(),
})

export type ConfiguracaoEmailFormValues = z.infer<typeof configuracaoEmailSchema>
