import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ApiErrorBody, ApiValidationErrorBody, DetalheValidacao } from './types'

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
  readonly detalhes: DetalheValidacao[]

  constructor(kind: ApiErrorKind, status: number, message: string, detalhes: DetalheValidacao[] = []) {
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
 * O body de erro do back segue o envelope `{ erro, detalhes? }`, onde cada
 * detalhe é `{ campo, mensagem }` (a partir da Fase 3 do contrato).
 */
export function toApiError(error: unknown, status: number | undefined): ApiError {
  const code = status ?? 0
  if (!status) {
    return new ApiError('network', 0, 'Falha de comunicação com o servidor.')
  }

  const body = error as Partial<ApiErrorBody & ApiValidationErrorBody> | undefined
  const erro = body?.erro ?? defaultMessageFor(code)
  const detalhes = (body?.detalhes ?? []).filter((d): d is DetalheValidacao => d != null)
  return new ApiError(kindFromStatus(code), code, erro, detalhes)
}

function defaultMessageFor(status: number): string {
  if (status === 401) return 'Sessão expirada — faça login novamente.'
  if (status === 403) return 'Você não tem permissão para esta ação.'
  if (status === 404) return 'Registro não encontrado.'
  if (status >= 500) return 'Erro no servidor. Tente novamente em instantes.'
  return 'Ocorreu um erro inesperado.'
}

export function isValidationError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.kind === 'validation'
}

/**
 * Distribui os `detalhes` de um erro 422 nos campos do formulário (RHF).
 *
 * O back envia `campo` em camelCase idêntico ao nome do campo no form, então
 * o mapeamento é direto — não há mais adivinhação por regex sobre a mensagem.
 * `aliases` cobre os casos em que o nome do campo no front difere do back.
 *
 * Retorna as mensagens que **não** foram atribuídas a nenhum campo (campo
 * vazio, desconhecido ou fora de `camposValidos`) para o caller exibir num
 * toast/resumo — nenhuma mensagem é silenciosamente descartada.
 */
export function aplicarErrosValidacao<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  opcoes?: {
    /** Só atribui a campos desta lista; os demais viram mensagem de resumo. */
    camposValidos?: readonly Path<T>[]
    /** Mapeia nome-do-back → nome-do-campo-no-form quando divergem. */
    aliases?: Record<string, Path<T>>
  },
): string[] {
  if (!isValidationError(err)) return []

  const naoAtribuidos: string[] = []
  for (const detalhe of err.detalhes) {
    const campoBack = detalhe.campo?.trim() ?? ''
    const mensagem = detalhe.mensagem?.trim() ?? ''

    if (!campoBack) {
      if (mensagem) naoAtribuidos.push(mensagem)
      continue
    }

    const campo = (opcoes?.aliases?.[campoBack] ?? campoBack) as Path<T>
    if (opcoes?.camposValidos && !opcoes.camposValidos.includes(campo)) {
      if (mensagem) naoAtribuidos.push(mensagem)
      continue
    }

    setError(campo, { type: 'server', message: mensagem })
  }
  return naoAtribuidos
}
