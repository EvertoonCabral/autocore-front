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
export type VeiculoResumoDto        = components['schemas']['VeiculoResumoDto']
export type VeiculoDetalheDto       = components['schemas']['VeiculoDetalheDto']
/**
 * Payload do conflito de placa (corpo do HTTP 409 ao criar veículo). O back
 * não emite este DTO como schema nomeado no OpenAPI (o campo `conflito` sai
 * tipado como objeto livre), então o shape é declarado aqui manualmente,
 * espelhando `ConflitoPlacaDto` no back.
 */
export interface ConflitoPlacaDto {
  veiculoId: number
  placa: string
  clienteId: number
  clienteNome: string
}
export type ItemServicoDto          = components['schemas']['ItemServicoDto']
export type ItemProdutoDto          = components['schemas']['ItemProdutoDto']
export type PagamentoDto            = components['schemas']['PagamentoDto']
export type OrdemPendenteDto        = components['schemas']['OrdemPendenteDto']
export type HistoricoCobrancaDto    = components['schemas']['HistoricoCobrancaDto']
export type ConfiguracaoDto         = components['schemas']['ConfiguracaoDto']
export type ConfiguracaoEmpresaDto  = components['schemas']['ConfiguracaoEmpresaDto']
export type AtualizarConfiguracaoEmpresaDto =
  components['schemas']['AtualizarConfiguracaoEmpresaDto']
export type LogoAtualizadoDto       = components['schemas']['LogoAtualizadoDto']
export type CobrancaJobResultado    = components['schemas']['CobrancaJobResultado']
export type CobrancaIndividualResultado = components['schemas']['CobrancaIndividualResultado']
export type AuditoriaOperacaoDto    = components['schemas']['AuditoriaOperacaoDto']
export type DashboardResumoDto      = components['schemas']['DashboardResumoDto']
export type DashboardContagensOsDto = components['schemas']['DashboardContagensOsDto']
export type DashboardPendenciasDto  = components['schemas']['DashboardPendenciasDto']
export type DashboardEstoqueDto     = components['schemas']['DashboardEstoqueDto']
export type DashboardFaturamentoDto = components['schemas']['DashboardFaturamentoDto']
export type DistribuicoesDashboardDto       = components['schemas']['DistribuicoesDashboardDto']
export type DistribuicaoFormaPagamentoDto   = components['schemas']['DistribuicaoFormaPagamentoDto']
export type DistribuicaoStatusOsDto         = components['schemas']['DistribuicaoStatusOsDto']
export type MesFaturamentoDto               = components['schemas']['MesFaturamentoDto']

// ─── Relatórios financeiros ────────────────────────────────────────────────
export type FaturamentoRecebidoDto  = components['schemas']['FaturamentoRecebidoDto']
export type FaturamentoDiaDto       = components['schemas']['FaturamentoDiaDto']
export type FaturamentoPorFormaDto  = components['schemas']['FaturamentoPorFormaDto']
export type ResumoFinanceiroDto     = components['schemas']['ResumoFinanceiroDto']
export type AgingFaixaDto           = components['schemas']['AgingFaixaDto']
export type RankingClientesDto      = components['schemas']['RankingClientesDto']
export type RankingClienteDto       = components['schemas']['RankingClienteDto']

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
/** `{ campo, mensagem }` — um detalhe de erro de validação 422. */
export type DetalheValidacao       = components['schemas']['DetalheValidacao']

// ─── Tipos derivados (claims) ──────────────────────────────────────────────
/**
 * Roles do sistema — claim "role" do JWT. O backend devolve como string,
 * mas em código tratamos como union literal para casar com
 * `shared/guards/permissions.ts`.
 */
export type Role = 'Admin' | 'Operador'
