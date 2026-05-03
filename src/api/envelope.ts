import type { ApiEnvelope, ApiPaginated } from './types'

/**
 * Helpers para extrair o conteúdo do envelope `{ dados }` e `{ dados, total, ... }`.
 *
 * Uso:
 *   const res = await api.GET('/api/clientes/{id}', { params: { path: { id } } })
 *   const cliente = unwrap<ClienteDto>(res.data)
 */

export function unwrap<T>(payload: unknown): T {
  const env = payload as ApiEnvelope<T> | undefined
  if (!env || typeof env !== 'object' || !('dados' in env)) {
    throw new Error('Envelope inválido — campo "dados" ausente.')
  }
  return env.dados
}

export function unwrapPaginated<T>(payload: unknown): ApiPaginated<T> {
  const env = payload as ApiPaginated<T> | undefined
  if (!env || typeof env !== 'object' || !('dados' in env) || !Array.isArray(env.dados)) {
    throw new Error('Envelope paginado inválido.')
  }
  return env
}
