import { useEffect, type ReactNode } from 'react'
import { useObterConfiguracaoEmpresa } from '@/features/configuracoes/hooks/useObterConfiguracaoEmpresa'
import { montarCssAccent } from './color'

const STYLE_ID = 'autocore-accent-vars'

/**
 * Injeta as CSS vars do accent (--primary/--ring/--accent/--chart-1/…) em
 * runtime, a partir de `GET /api/configuracoes/empresa` (endpoint anônimo —
 * funciona também na tela de login). Escreve um `<style>` com escopos
 * `:root` (accentLight) e `.dark` (accentDark), anexado ao fim do `<head>`
 * — mesma especificidade das regras de `globals.css`, mas vence por ordem
 * de fonte, então sobrescreve os defaults laranja.
 *
 * A query é cacheada pelo TanStack Query; ao salvar na aba "Aparência" a
 * invalidação refaz o fetch e este efeito re-injeta o CSS automaticamente.
 *
 * Deve envolver TODA a árvore (inclusive rotas públicas). Enquanto o fetch
 * não resolve, os defaults de `globals.css` seguem valendo (sem flash).
 */
export function AccentProvider({ children }: { children: ReactNode }) {
  const { data } = useObterConfiguracaoEmpresa()

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!data) return // mantém defaults do globals.css até o fetch resolver

    const css = montarCssAccent(data.accentLight, data.accentDark)

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!style) {
      style = document.createElement('style')
      style.id = STYLE_ID
      document.head.appendChild(style)
    }
    style.textContent = css
  }, [data])

  return <>{children}</>
}
