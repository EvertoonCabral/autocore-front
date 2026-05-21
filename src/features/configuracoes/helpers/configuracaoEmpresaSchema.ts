import { z } from 'zod'

/**
 * Schema do form de edição do nome da empresa
 * (`PUT /api/configuracoes/empresa`).
 *
 * Mantemos validação alinhada ao back:
 * - `nomeEmpresa` — obrigatório, ≤ 150 chars (após trim).
 */
export const nomeEmpresaSchema = z.object({
  nomeEmpresa: z
    .string({ required_error: 'Nome é obrigatório.' })
    .trim()
    .min(1, 'Nome é obrigatório.')
    .max(150, 'Máximo de 150 caracteres.'),
})

export type NomeEmpresaFormValues = z.infer<typeof nomeEmpresaSchema>

export const MIME_LOGO_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp'] as const
export const TAMANHO_MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2 MB

export type ResultadoValidacaoLogo =
  | { ok: true }
  | { ok: false; erro: string }

/**
 * Espelha as validações do back (`PUT /api/configuracoes/empresa/logo`):
 * aceita apenas PNG / JPG / WebP e até 2 MB. O servidor recalcula o hash.
 */
export function validarArquivoLogo(arquivo: File): ResultadoValidacaoLogo {
  if (!(MIME_LOGO_PERMITIDOS as readonly string[]).includes(arquivo.type)) {
    return { ok: false, erro: 'Formato não suportado. Use PNG, JPG ou WebP.' }
  }
  if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) {
    const tamanhoMb = (arquivo.size / 1024 / 1024).toFixed(1)
    return {
      ok: false,
      erro: `Arquivo grande demais (${tamanhoMb} MB). Máximo: 2 MB.`,
    }
  }
  return { ok: true }
}
