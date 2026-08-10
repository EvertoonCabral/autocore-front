import { Badge } from '@/components/ui/badge'
import { formatBRL, formatDataHora } from '@/lib/format'
import {
  statusIntencaoLabel,
  statusIntencaoVariant,
} from '@/shared/enums/statusIntencaoPagamento'
import { tipoIntencaoLabel } from '@/shared/enums/tipoIntencaoPagamento'
import { useListarIntencoesDaOrdem } from '../hooks/useListarIntencoesDaOrdem'

interface Props {
  ordemId: number
}

/** Histórico de cobranças online (Pix/link) geradas para a OS. */
export function IntencoesPagamentoTable({ ordemId }: Props) {
  const { data, isLoading } = useListarIntencoesDaOrdem(ordemId)

  if (isLoading) return null
  if (!data || data.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 text-right font-medium">Base</th>
            <th className="px-3 py-2 text-right font-medium">Acréscimo</th>
            <th className="px-3 py-2 text-right font-medium">Cobrado</th>
            <th className="px-3 py-2 font-medium">Gerado em</th>
          </tr>
        </thead>
        <tbody>
          {data.map((i) => (
            <tr key={i.id} className="border-t">
              <td className="px-3 py-2">{tipoIntencaoLabel(i.tipo)}</td>
              <td className="px-3 py-2">
                <Badge variant={statusIntencaoVariant(i.status)}>
                  {statusIntencaoLabel(i.status)}
                </Badge>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatBRL(i.valorBase)}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {(i.valorAcrescimo ?? 0) > 0 ? formatBRL(i.valorAcrescimo) : '—'}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatBRL(i.valorCobrado)}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {formatDataHora(i.criadoEm)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
