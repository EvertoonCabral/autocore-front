/**
 * Aliases convenientes para os DTOs gerados a partir do `openapi.json`.
 *
 * **Tudo aqui é alias do schema gerado** (`./schema.d.ts`). Se algum DTO
 * mudar no back, basta rodar `npm run api:types` — o schema atualiza e os
 * aliases vão junto. **Não redigite shapes** que já existam em
 * `components['schemas']`.
 */

import type { components } from './schema'

// ─── DTOs por módulo ───────────────────────────────────────────────────────
export type LoginResultDto = components['schemas']['LoginResultDto']
export type UsuarioDto     = components['schemas']['UsuarioDto']
export type ClienteDto     = components['schemas']['ClienteDto']
export type ProdutoDto     = components['schemas']['ProdutoDto']
export type CatalogoServicoDto      = components['schemas']['CatalogoServicoDto']
export type OrdemServicoResumoDto   = components['schemas']['OrdemServicoResumoDto']
export type OrdemServicoDetalheDto  = components['schemas']['OrdemServicoDetalheDto']
export type ItemServicoDto          = components['schemas']['ItemServicoDto']
export type ItemProdutoDto          = components['schemas']['ItemProdutoDto']
export type PagamentoDto            = components['schemas']['PagamentoDto']
export type OrdemPendenteDto        = components['schemas']['OrdemPendenteDto']
export type HistoricoCobrancaDto    = components['schemas']['HistoricoCobrancaDto']
export type ConfiguracaoDto         = components['schemas']['ConfiguracaoDto']
export type CobrancaJobResultado    = components['schemas']['CobrancaJobResultado']

// ─── Envelopes ─────────────────────────────────────────────────────────────
/** `{ dados: T }` — envelope padrão de item único. */
export interface ApiEnvelope<T> {
  dados: T
}

/** `{ dados, total, pagina, porPagina }` — envelope padrão paginado. */
export interface ApiPaginated<T> {
  dados: T[]
  total: number
  pagina: number
  porPagina: number
}

// ─── Erros ─────────────────────────────────────────────────────────────────
export type ApiErrorBody           = components['schemas']['ApiErrorResponse']
export type ApiValidationErrorBody = components['schemas']['ApiValidationErrorResponse']

// ─── Tipos derivados (claims) ──────────────────────────────────────────────
/**
 * Roles do sistema — claim "role" do JWT. O backend devolve como string,
 * mas em código tratamos como union literal para casar com
 * `shared/guards/permissions.ts`.
 */
export type Role = 'Admin' | 'Operador'
