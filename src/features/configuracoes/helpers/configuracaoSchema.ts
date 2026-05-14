import { z } from 'zod'

/**
 * Whitelist de chaves aceitas pelo back (ver `regras-negocio/configuracoes.md`).
 * Qualquer chave fora desta lista é rejeitada com 422 no back.
 */
export const CONFIG_KEYS = {
  DiasParaCobranca: 'DiasParaCobranca',
  MensagemCobranca: 'MensagemCobranca',
  PrecosAtualizadosEm: 'PrecosAtualizadosEm',
} as const

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS]

/**
 * Form único editando as 3 configurações de uma vez. O back tem um endpoint
 * por chave (`PUT /api/configuracoes/{chave}`), então o submit dispara
 * mutations sequenciais — só envia o que mudou (isDirty per-field).
 */
export const configuracoesFormSchema = z.object({
  diasParaCobranca: z.coerce
    .number({ invalid_type_error: 'Informe um número inteiro.' })
    .int('Deve ser um número inteiro.')
    .min(0, 'Deve ser maior ou igual a zero.')
    .max(365, 'Limite máximo razoável: 365 dias.'),
  mensagemCobranca: z
    .string()
    .trim()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres.')
    .max(2000, 'Mensagem deve ter no máximo 2000 caracteres.'),
  precosAtualizadosEm: z
    .string()
    .trim()
    .max(2000, 'Valor fora do limite.')
    // Aceita vazio OU ISO-8601 (validação leve — front não precisa ser tão estrita
    // quanto a do back; um dateTime do input é suficiente).
    .refine(
      (v) => v === '' || !Number.isNaN(Date.parse(v)),
      'Use o formato ISO-8601 (ex.: 2024-07-20T10:30:00Z) ou deixe vazio.',
    ),
})

export type ConfiguracoesFormValues = z.infer<typeof configuracoesFormSchema>

// ─── Mensagem padrão e preview ─────────────────────────────────────────────

/** Template embutido no back — exibido como fallback quando o campo está vazio. */
export const MENSAGEM_COBRANCA_DEFAULT =
  'Olá {Cliente}, identificamos uma pendência na sua OS {Numero} no valor de R$ {Valor} ' +
  'com vencimento em {Vencimento}. Por favor, entre em contato para regularizar. — AutoCore'

/** Dados de exemplo para o preview da mensagem. */
export const MENSAGEM_PREVIEW_SAMPLE = {
  Cliente: 'João Silva',
  Numero: 'OS-0007',
  Valor: '150,00',
  Vencimento: '06/05/2026',
} as const

/**
 * Renderiza placeholders `{Cliente}`, `{Numero}`, `{Valor}`, `{Vencimento}` na
 * mensagem. Suporta o alias `{Vencimento:dd/MM/yyyy}` (back trata como sinônimo).
 */
export function renderizarMensagemPreview(template: string): string {
  if (!template) return ''
  return template
    .replace(/\{Cliente\}/g, MENSAGEM_PREVIEW_SAMPLE.Cliente)
    .replace(/\{Numero\}/g, MENSAGEM_PREVIEW_SAMPLE.Numero)
    .replace(/\{Valor\}/g, MENSAGEM_PREVIEW_SAMPLE.Valor)
    .replace(/\{Vencimento(?::[^}]*)?\}/g, MENSAGEM_PREVIEW_SAMPLE.Vencimento)
}
