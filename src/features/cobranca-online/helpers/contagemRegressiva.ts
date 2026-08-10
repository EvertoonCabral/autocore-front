/**
 * Formata o tempo restante até `expiraEm` (ISO UTC) como `mm:ss`.
 * Retorna `null` quando não há prazo, e `'00:00'` quando já venceu.
 */
export function formatarTempoRestante(
  expiraEm: string | null | undefined,
  agora: number = Date.now(),
): string | null {
  if (!expiraEm) return null
  const alvo = new Date(expiraEm).getTime()
  if (Number.isNaN(alvo)) return null
  const restanteMs = alvo - agora
  if (restanteMs <= 0) return '00:00'
  const totalSeg = Math.floor(restanteMs / 1000)
  const min = Math.floor(totalSeg / 60)
  const seg = totalSeg % 60
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`
}

/** True quando `expiraEm` já passou. */
export function estaExpirado(
  expiraEm: string | null | undefined,
  agora: number = Date.now(),
): boolean {
  if (!expiraEm) return false
  const alvo = new Date(expiraEm).getTime()
  if (Number.isNaN(alvo)) return false
  return alvo - agora <= 0
}
