import { formatBRL } from '@/lib/format'

interface Props {
  totalAdiantado: number
  totalExcedente: number
}

/**
 * Avisos persistentes sobre adiantamentos da OS: valor já adiantado (será
 * registrado como pagamento no fechamento) e excedente a devolver (reembolso
 * manual pelo Admin). Não renderiza nada quando não há nem um nem outro.
 */
export function AdiantamentoAviso({ totalAdiantado, totalExcedente }: Props) {
  if (totalAdiantado <= 0 && totalExcedente <= 0) return null

  return (
    <div className="space-y-2">
      {totalAdiantado > 0 && (
        <p className="rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-800 dark:text-blue-200">
          <strong>{formatBRL(totalAdiantado)}</strong> em adiantamento aprovado. Será registrado
          como pagamento automaticamente quando a OS for concluída.
        </p>
      )}
      {totalExcedente > 0 && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
          <strong>{formatBRL(totalExcedente)}</strong> a devolver ao cliente (adiantamento maior que
          o total da OS). Faça o reembolso pelo Mercado Pago.
        </p>
      )}
    </div>
  )
}
