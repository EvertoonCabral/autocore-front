import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ThemeContext,
  TEMA_STORAGE_KEY,
  type Tema,
  type TemaResolvido,
} from './ThemeContext'

function lerTemaInicial(): Tema {
  if (typeof window === 'undefined') return 'system'
  const salvo = window.localStorage.getItem(TEMA_STORAGE_KEY)
  if (salvo === 'light' || salvo === 'dark' || salvo === 'system') return salvo
  return 'system'
}

function resolver(tema: Tema): TemaResolvido {
  if (tema !== 'system') return tema
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function aplicarClasseDark(resolvido: TemaResolvido) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', resolvido === 'dark')
  root.style.colorScheme = resolvido
}

/**
 * Provider global de tema (claro / escuro / segue sistema).
 *
 * - Preferência persiste em `localStorage` sob `autocore:tema`.
 * - "system" escuta `prefers-color-scheme` e re-resolve em tempo real.
 * - Aplica a classe `dark` em `<html>` — Tailwind `darkMode: ['class']`
 *   ativa as variáveis CSS de `.dark` definidas em `globals.css`.
 * - A primeira aplicação (anti-FOUC) é feita por `/theme-init.js` em
 *   `index.html` que roda antes do React montar.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(() => lerTemaInicial())
  const [resolvido, setResolvido] = useState<TemaResolvido>(() => resolver(lerTemaInicial()))

  // Aplica sempre que o tema (preferência) muda.
  useEffect(() => {
    const r = resolver(tema)
    setResolvido(r)
    aplicarClasseDark(r)
  }, [tema])

  // Quando preferência é "system", escuta mudanças do SO em tempo real.
  useEffect(() => {
    if (tema !== 'system') return
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const r: TemaResolvido = e.matches ? 'dark' : 'light'
      setResolvido(r)
      aplicarClasseDark(r)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [tema])

  const setTema = useCallback((novo: Tema) => {
    setTemaState(novo)
    try {
      window.localStorage.setItem(TEMA_STORAGE_KEY, novo)
    } catch {
      // localStorage indisponível (modo privado restritivo) — segue em memória.
    }
  }, [])

  const value = useMemo(
    () => ({ tema, resolvido, setTema }),
    [tema, resolvido, setTema],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
