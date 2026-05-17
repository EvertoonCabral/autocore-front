import { z } from 'zod'

/**
 * Schema do form de edição da configuração da Evolution API
 * (`PUT /api/configuracoes/cobranca`).
 *
 * Regras de campo:
 * - `baseUrl` — URL válida (obrigatória).
 * - `apiKey` — opcional. Vazio = manter atual no back. Preenchido = substituir.
 *   O front nunca recebe a chave atual (back devolve apenas `apiKeyDefinida: bool`).
 * - `instancia` — nome livre da instância (após `trim`).
 * - `usarStub` — quando ligado, cobranças são apenas logadas.
 */
export const configuracaoCobrancaSchema = z.object({
  baseUrl: z
    .string({ required_error: 'Informe a URL base da Evolution.' })
    .trim()
    .min(1, 'Informe a URL base da Evolution.')
    .max(500, 'URL muito longa (máx 500).')
    .url('Informe uma URL válida (ex.: http://localhost:8080).'),
  apiKey: z
    .string()
    .max(500, 'Chave muito longa (máx 500).')
    .optional()
    .default(''),
  instancia: z
    .string({ required_error: 'Informe o nome da instância.' })
    .trim()
    .min(1, 'Informe o nome da instância.')
    .max(100, 'Nome da instância muito longo (máx 100).'),
  usarStub: z.boolean(),
})

export type ConfiguracaoCobrancaFormValues = z.infer<typeof configuracaoCobrancaSchema>
