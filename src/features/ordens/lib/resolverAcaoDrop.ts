import type { StatusOrdem } from '@/shared/enums/statusOrdem'

/** Decisão de um drop no quadro: mudar de etapa, fechar a OS, ou nada. */
export type AcaoDrop = 'mudar' | 'fechar' | 'noop'

/**
 * Resolve o que fazer ao soltar um card da coluna `origem` na coluna `destino`.
 *
 * Regras (espelham o quadro):
 * - Soltar na mesma coluna → `noop`.
 * - Origem terminal (Concluída/Cancelada) não arrasta → `noop`.
 * - Destino Concluída → `fechar` (abre diálogo de confirmação).
 * - Destino entre etapas não-terminais (Aberta/EmAndamento/AguardandoProduto)
 *   → `mudar` (PATCH otimista).
 * - Qualquer outro destino (ex.: Cancelada, que não existe como coluna) → `noop`.
 */
export function resolverAcaoDrop(origem: StatusOrdem, destino: StatusOrdem): AcaoDrop {
  if (origem === destino) return 'noop'
  if (origem === 4 || origem === 5) return 'noop'
  if (destino === 4) return 'fechar'
  if (destino === 1 || destino === 2 || destino === 3) return 'mudar'
  return 'noop'
}
