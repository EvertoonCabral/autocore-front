import { toApiError } from './errors'
import type { ApiEnvelope, ApiPaginated } from './types'

/**
 * Helpers para consumir respostas do openapi-fetch e extrair o conteúdo dos
 * envelopes `{ dados }` (item único) e `{ dados, total, ... }` (paginado).
 *
 * O openapi-fetch tipa `data` com todos os campos opcionais/nullable (limitação
 * do gerador). `receber`/`receberPaginado` centralizam a checagem de erro +
 * o unwrap num único ponto, eliminando o `as { data?: ... }` repetido em cada
 * hook. Lançam `ApiError` tipado quando a resposta é de erro.
 */

interface ResultadoOpenApi {
  data?: unknown
  error?: unknown
  response: Response
}

/** `{ dados: T }` → T. Lança ApiError em resposta de erro. */
export function receber<T>(result: ResultadoOpenApi): T {
  if (result.error || !result.data) {
    throw toApiError(result.error, result.response.status)
  }
  return unwrap<T>(result.data)
}

/** `{ dados: T[], total, pagina, porPagina }` → o envelope paginado. Lança ApiError em erro. */
export function receberPaginado<T>(result: ResultadoOpenApi): ApiPaginated<T> {
  if (result.error || !result.data) {
    throw toApiError(result.error, result.response.status)
  }
  return result.data as ApiPaginated<T>
}

export function unwrap<T>(payload: unknown): T {
  const env = payload as ApiEnvelope<T> | undefined
  if (!env || typeof env !== 'object' || !('dados' in env)) {
    throw new Error('Envelope inválido — campo "dados" ausente.')
  }
  return env.dados
}
