/**
 * Tipos de resposta espelhados das DTOs do backend (Application/DTOs/Auth/*).
 *
 * O openapi.json gerado pelo back NÃO tipa respostas porque os controllers
 * retornam objetos anônimos (`new { dados = ... }`). Enquanto o backend não
 * adiciona [ProducesResponseType] + ResponseEnvelope<T>, mantemos estes tipos
 * sincronizados manualmente. Veja CLAUDE.md → "API types".
 */

/** Envelope `{ dados: ... }` da API. */
export interface ApiEnvelope<T> {
  dados: T
}

/** Envelope paginado `{ dados, total, pagina, porPagina }`. */
export interface ApiPaginated<T> {
  dados: T[]
  total: number
  pagina: number
  porPagina: number
}

/** Erro de regra de negócio (HTTP 400) ou autenticação (HTTP 401/404). */
export interface ApiErrorBody {
  erro: string
  detalhes?: string[]
}

/** Erro de validação FluentValidation (HTTP 422). */
export interface ApiValidationErrorBody {
  erro: string
  detalhes: string[]
}

/** Resposta do POST /api/auth/login (body, em paralelo ao cookie httpOnly). */
export interface LoginResultDto {
  token: string
  email: string
  nomeCompleto: string
  role: 'Admin' | 'Operador' | string
  expiraEm: string // ISO-8601 UTC
}

/** Resposta do GET /api/auth/me. */
export interface UsuarioDto {
  id: number
  nomeCompleto: string
  email: string
  role: 'Admin' | 'Operador' | string
  ativo: boolean
}
