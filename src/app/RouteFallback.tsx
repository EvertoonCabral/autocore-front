import { Loader2 } from 'lucide-react'

/**
 * Fallback exibido enquanto o chunk lazy de uma rota carrega. Cada página é
 * um chunk separado (code splitting no router) — isola libs pesadas como
 * recharts no chunk do Dashboard em vez do bundle inicial.
 */
export function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Carregando…</span>
    </div>
  )
}
