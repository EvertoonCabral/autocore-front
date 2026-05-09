import { useEffect, useState } from 'react'

/**
 * Retorna o valor após `delayMs` sem atualizações. Útil para buscas com input
 * que disparam queries — evita um request por tecla.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
