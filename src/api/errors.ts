import type { ApiErrorBody, ApiValidationErrorBody } from './types'

export type ApiErrorKind =
  | 'validation' // 422
  | 'business' // 400
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'notFound' // 404
  | 'server' // 5xx
  | 'network' // fetch falhou
  | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly detalhes: string[]

  constructor(kind: ApiErrorKind, status: number, message: string, detalhes: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.detalhes = detalhes
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 422) return 'validation'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'notFound'
  if (status >= 500) return 'server'
  if (status === 400) return 'business'
  return 'unknown'
}

/**
 * Converte o `error` retornado pelo openapi-fetch em ApiError tipado.
 * O body de erro do back segue o envelope `{ erro, detalhes? }`.
 */
export function toApiError(error: unknown, status: number | undefined): ApiError {
  const code = status ?? 0
  if (!status) {
    return new ApiError('network', 0, 'Falha de comunicação com o servidor.')
  }

  const body = error as Partial<ApiErrorBody & ApiValidationErrorBody> | undefined
  const erro = body?.erro ?? defaultMessageFor(code)
  const detalhes = body?.detalhes ?? []
  return new ApiError(kindFromStatus(code), code, erro, detalhes)
}

function defaultMessageFor(status: number): string {
  if (status === 401) return 'Sessão expirada — faça login novamente.'
  if (status === 403) return 'Você não tem permissão para esta ação.'
  if (status === 404) return 'Registro não encontrado.'
  if (status >= 500) return 'Erro no servidor. Tente novamente em instantes.'
  return 'Ocorreu um erro inesperado.'
}

/**
 * Distribui os `detalhes` de um 422 entre os campos do form (RHF).
 * O back devolve mensagens livres como "Nome é obrigatório.";
 * o callback `setFieldError` decide em qual campo cada detalhe entra.
 *
 * Uso típico: o caller mantém uma tabela `regex → fieldName` e chama
 * `setError(fieldName, { message })`.
 */
export function isValidationError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.kind === 'validation'
}
