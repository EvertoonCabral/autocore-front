import { useCallback, useState } from 'react'

export type OsViewMode = 'lista' | 'quadro'

const STORAGE_KEY = 'osViewMode'

function ler(): OsViewMode {
  if (typeof window === 'undefined') return 'lista'
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'quadro' ? 'quadro' : 'lista'
}

/**
 * Modo de visualização das OS (Lista/Quadro) persistido em localStorage sob
 * a chave `osViewMode`. Default `'lista'`. SSR-safe (guarda `typeof window`).
 */
export function useOsViewMode(): [OsViewMode, (mode: OsViewMode) => void] {
  const [mode, setModeState] = useState<OsViewMode>(ler)

  const setMode = useCallback((next: OsViewMode) => {
    setModeState(next)
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  return [mode, setMode]
}
