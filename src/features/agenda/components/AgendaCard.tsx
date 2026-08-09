import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { StatusOrdemBadge } from '@/shared/components/StatusOrdemBadge'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'
import type { AgendaOrdemDto } from '@/api/types'

interface Props {
  ordem: AgendaOrdemDto
}

/**
 * Cartão de uma OS agendada na coluna do dia. Mostra hora (wall-clock local),
 * número (mono), cliente, veículo e o status. Clicar abre o detalhe da OS.
 */
export function AgendaCard({ ordem }: Props) {
  const navigate = useNavigate()
  const hora = ordem.dataAgendamentoInicio
    ? format(new Date(ordem.dataAgendamentoInicio), 'HH:mm')
    : '--:--'

  return (
    <button
      type="button"
      onClick={() => ordem.id != null && navigate(`/ordens/${ordem.id}`)}
      className="w-full rounded-lg border border-border bg-card p-2.5 text-left shadow-sm transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">{hora}</span>
        <StatusOrdemBadge status={(ordem.status ?? 1) as StatusOrdem} />
      </div>
      <div className="mt-1 font-mono text-[11px] text-muted-foreground">{ordem.numero}</div>
      <div className="truncate text-sm font-medium">{ordem.clienteNome}</div>
      {ordem.veiculoDescricao && (
        <div className="truncate text-xs text-muted-foreground">{ordem.veiculoDescricao}</div>
      )}
    </button>
  )
}
