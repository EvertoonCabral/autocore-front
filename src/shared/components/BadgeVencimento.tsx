import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { diasDesde, formatData } from '@/lib/format'

interface Props {
  dataVencimento?: string | null | undefined
  /** Quando true, exibe escalada visual baseada em dias de atraso. */
  vencida?: boolean
  /** Acima de quantos dias de atraso a pendência vira "Atrasada" (escalada). Default 30. */
  limiarAtrasada?: number
  /** Mostra a data formatada acima do badge. */
  comData?: boolean
}

/**
 * Badge de status de vencimento usado em pendências e detalhes de OS.
 *
 * Estados visuais:
 *  - Sem data → nada
 *  - Data futura ou hoje → apenas a data (sem badge)
 *  - Vencida 1..30d → badge "Vencida" (variant destructive vermelho)
 *  - Vencida >30d   → badge "Atrasada {'>'}30d" (vermelho mais escuro,
 *    ícone diferente) — sinaliza débito antigo que provavelmente não
 *    responde mais à cobrança automática diária e precisa de ação humana
 *
 * O componente expõe o número de dias no atributo `title` do badge,
 * útil para tooltip nativo do browser.
 */
export function BadgeVencimento({
  dataVencimento,
  vencida = false,
  limiarAtrasada = 30,
  comData = true,
}: Props) {
  if (!dataVencimento) return null

  const diasAtraso = diasDesde(dataVencimento)
  const muitoAtrasada = vencida && diasAtraso !== null && diasAtraso > limiarAtrasada

  return (
    <div className="flex flex-col">
      {comData && <span className="tabular-nums">{formatData(dataVencimento)}</span>}
      {muitoAtrasada ? (
        <Badge
          className="mt-1 self-start text-xs bg-red-800 text-white hover:bg-red-800 dark:bg-red-900"
          title={`Vencida há ${diasAtraso} dias`}
        >
          <AlertTriangle className="h-3 w-3" />
          Atrasada {'>'}
          {limiarAtrasada}d
        </Badge>
      ) : vencida ? (
        <Badge
          variant="destructive"
          className="mt-1 self-start text-xs"
          title={
            diasAtraso !== null
              ? `Vencida há ${diasAtraso} dia${diasAtraso === 1 ? '' : 's'}`
              : undefined
          }
        >
          <AlertCircle className="h-3 w-3" />
          Vencida
        </Badge>
      ) : null}
    </div>
  )
}
