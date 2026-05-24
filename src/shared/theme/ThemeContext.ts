import { createContext, useContext } from 'react'

export type Tema = 'light' | 'dark' | 'system'
export type TemaResolvido = 'light' | 'dark'

export interface ThemeContextValue {
  /** Preferência salva — pode ser 'system'. */
  tema: Tema
  /** Tema efetivamente aplicado agora — sempre 'light' ou 'dark'. */
  resolvido: TemaResolvido
  /** Troca a preferência (persistida em localStorage). */
  setTema: (t: Tema) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export const TEMA_STORAGE_KEY = 'autocore:tema'

export function useTema(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTema deve ser usado dentro de <ThemeProvider>.')
  }
  return ctx
}
