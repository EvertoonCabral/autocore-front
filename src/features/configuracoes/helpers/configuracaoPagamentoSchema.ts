import { z } from 'zod'

/**
 * Schema do form de edição da configuração de pagamento (Mercado Pago)
 * (`PUT /api/configuracoes/pagamento`). Espelha o
 * `AtualizarConfiguracaoPagamentoCommandValidator` do back.
 *
 * Segredos (`accessToken`, `webhookSecret`) são opcionais: vazio = manter o
 * atual no back; preenchido = substituir. O front nunca recebe os segredos
 * (back devolve apenas `accessTokenDefinido`/`webhookSecretDefinido`).
 */
export const configuracaoPagamentoSchema = z.object({
  accessToken: z.string().max(500, 'Access token muito longo (máx 500).').optional().default(''),
  webhookSecret: z
    .string()
    .max(500, 'Webhook secret muito longo (máx 500).')
    .optional()
    .default(''),
  publicKey: z.string().trim().max(200, 'Public key muito longa (máx 200).').optional().default(''),
  // Ambiente: 1 = Sandbox, 2 = Produção.
  ambiente: z.coerce
    .number()
    .int()
    .refine((v): v is 1 | 2 => v === 1 || v === 2, 'Ambiente inválido.'),
  usarStub: z.boolean(),
  baseUrlPublica: z
    .string()
    .trim()
    .max(500, 'URL muito longa (máx 500).')
    .refine(
      (v) => v === '' || /^https?:\/\/.+/i.test(v),
      'Informe uma URL absoluta válida (http:// ou https://).',
    )
    .optional()
    .default(''),
  emailFallbackPagador: z
    .string()
    .trim()
    .max(200, 'E-mail muito longo (máx 200).')
    .refine((v) => v === '' || z.string().email().safeParse(v).success, 'E-mail inválido.')
    .optional()
    .default(''),
  pixExpiraMinutosBancada: z.coerce
    .number({ invalid_type_error: 'Informe um número.' })
    .int('Deve ser inteiro.')
    .min(1, 'Mínimo 1 minuto.')
    .max(4320, 'Máximo 4320 minutos (3 dias).'),
  pixExpiraMinutosRemoto: z.coerce
    .number({ invalid_type_error: 'Informe um número.' })
    .int('Deve ser inteiro.')
    .min(1, 'Mínimo 1 minuto.')
    .max(4320, 'Máximo 4320 minutos (3 dias).'),
  repassarTaxa: z.boolean(),
  taxaPixPercentual: z.coerce
    .number({ invalid_type_error: 'Informe um número.' })
    .min(0, 'Não pode ser negativa.')
    .max(99.999, 'Deve ser menor que 100%.'),
  taxaCartaoPercentual: z.coerce
    .number({ invalid_type_error: 'Informe um número.' })
    .min(0, 'Não pode ser negativa.')
    .max(99.999, 'Deve ser menor que 100%.'),
  jurosParcelamentoAoCliente: z.boolean(),
  parcelasMaximas: z.coerce
    .number({ invalid_type_error: 'Informe um número.' })
    .int('Deve ser inteiro.')
    .min(1, 'Mínimo 1 parcela.')
    .max(24, 'Máximo 24 parcelas.'),
  boletoHabilitado: z.boolean(),
})

export type ConfiguracaoPagamentoFormValues = z.infer<typeof configuracaoPagamentoSchema>
