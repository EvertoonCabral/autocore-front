import { formatBRL } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import type { SimulacaoCobrancaDto } from '../hooks/useCobrancaOnlineKeys'

interface Props {
  simulacao: SimulacaoCobrancaDto | undefined
  loading: boolean
}

/**
 * Mostra "base + taxa = total" antes de gerar a cobrança. Os valores vêm de
 * `/simular` — a fórmula de gross-up vive no back. Transparência do acréscimo
 * é requisito (Lei 13.455/2017): o cliente precisa ver o valor discriminado.
 */
export function ResumoValorCobrado({ simulacao, loading }: Props) {
  if (loading || !simulacao) {
    return <Skeleton className="h-20 w-full" />
  }

  const temAcrescimo = (simulacao.valorAcrescimo ?? 0) > 0

  return (
    <div className="rounded-md border bg-muted/40 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Valor da OS</span>
        <span className="tabular-nums">{formatBRL(simulacao.valorBase)}</span>
      </div>
      {temAcrescimo && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-muted-foreground">
            Acréscimo por pagamento ({(simulacao.taxaPercentual ?? 0).toLocaleString('pt-BR')}%)
          </span>
          <span className="tabular-nums">{formatBRL(simulacao.valorAcrescimo)}</span>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between border-t pt-2 font-medium">
        <span>Total a cobrar</span>
        <span className="tabular-nums text-base">{formatBRL(simulacao.valorCobrado)}</span>
      </div>
    </div>
  )
}
