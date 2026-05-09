import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Sincroniza paginação + filtros com `?` da URL. A página voltável e
 * compartilhável "de graça".
 *
 * Convenção:
 *   ?pagina=1&porPagina=20&q=texto&inativos=true
 *
 * Os filtros customizados ficam soltos no objeto `filters` do retorno.
 */
export interface PagedQueryState {
  pagina: number
  porPagina: number
  q: string
  /** Filtros adicionais (qualquer chave fora de pagina/porPagina/q). */
  filters: Record<string, string>
  setPagina: (p: number) => void
  setPorPagina: (n: number) => void
  setQ: (texto: string) => void
  setFilter: (key: string, value: string | boolean | null | undefined) => void
}

const RESERVED = new Set(['pagina', 'porPagina', 'q'])

export function usePagedQuery(defaults?: { pagina?: number; porPagina?: number }): PagedQueryState {
  const [params, setParams] = useSearchParams()

  const pagina = Number(params.get('pagina') ?? defaults?.pagina ?? 1) || 1
  const porPagina = Number(params.get('porPagina') ?? defaults?.porPagina ?? 20) || 20
  const q = params.get('q') ?? ''

  const filters = useMemo(() => {
    const out: Record<string, string> = {}
    for (const [k, v] of params.entries()) if (!RESERVED.has(k)) out[k] = v
    return out
  }, [params])

  const update = useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        mutator(next)
        return next
      })
    },
    [setParams],
  )

  const setPagina = useCallback(
    (p: number) =>
      update((next) => {
        if (p <= 1) next.delete('pagina')
        else next.set('pagina', String(p))
      }),
    [update],
  )

  const setPorPagina = useCallback(
    (n: number) =>
      update((next) => {
        next.set('porPagina', String(n))
        next.delete('pagina') // resetar paginação
      }),
    [update],
  )

  const setQ = useCallback(
    (texto: string) =>
      update((next) => {
        if (!texto) next.delete('q')
        else next.set('q', texto)
        next.delete('pagina')
      }),
    [update],
  )

  const setFilter = useCallback(
    (key: string, value: string | boolean | null | undefined) => {
      update((next) => {
        if (value == null || value === '' || value === false) next.delete(key)
        else next.set(key, String(value))
        next.delete('pagina')
      })
    },
    [update],
  )

  return { pagina, porPagina, q, filters, setPagina, setPorPagina, setQ, setFilter }
}
