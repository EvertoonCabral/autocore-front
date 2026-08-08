import { usePendencias } from '@/features/notificacoes/hooks/usePendencias'
import { useDashboardResumo } from '@/features/dashboard/hooks/useDashboardResumo'

export interface SidebarContadores {
  /** Cobranças vencidas — pílula de alerta no item "Pendências". */
  pendencias: number
  /** Cobranças a disparar (= vencidas) — contador neutro em "Cobranças". */
  cobrancas: number
  /** OS ativas (abertas + em andamento + aguardando produto) — neutro em "Ordens". */
  ordens: number
}

/**
 * Contadores dos itens da sidebar. Reaproveita as queries já cacheadas
 * `dashboard/pendencias` (sino do header) e `dashboard/resumo` (dashboard),
 * então não adiciona round-trips fora dessas telas.
 *
 * Mapeamento das fontes:
 *  - `pendencias` → `pendenciasVencidas` (OSs concluídas com saldo vencido);
 *  - `cobrancas`  → mesmo `pendenciasVencidas` (são as elegíveis a cobrança);
 *  - `ordens`     → soma de `contagensOs` (abertas + andamento + aguardando).
 */
export function useSidebarContadores(): SidebarContadores {
  const { data: pend } = usePendencias()
  const { data: resumo } = useDashboardResumo()

  const vencidas = pend?.pendenciasVencidas ?? 0
  const c = resumo?.contagensOs
  const ordens = (c?.abertas ?? 0) + (c?.emAndamento ?? 0) + (c?.aguardandoProduto ?? 0)

  return { pendencias: vencidas, cobrancas: vencidas, ordens }
}
