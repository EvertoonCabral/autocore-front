import { useMemo, useState } from 'react'
import { format, isSameDay, isSameMonth, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/cn'
import { Skeleton } from '@/components/ui/skeleton'
import { STATUS_ORDEM_META, type StatusOrdem } from '@/shared/enums/statusOrdem'
import type { AgendaOrdemDto } from '@/api/types'
import { useAgendaOrdens } from '../hooks/useAgendaOrdens'
import { janelaMes, porHora } from '../helpers/janela'
import { DiaAgendaSheet } from './DiaAgendaSheet'

/** Máximo de chips exibidos por célula antes de "+N mais". */
const MAX_CHIPS = 3

/** Rótulos das colunas, seg…dom. */
const DIAS_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

/**
 * Grade mensal (semanas × 7 colunas) construída com date-fns. Cada célula lista
 * de forma compacta as OS agendadas do dia; clicar abre o `DiaAgendaSheet` com a
 * lista completa. A data de referência e a navegação vêm da `AgendaToolbar`.
 */
export function MesCalendario({ referencia }: { referencia: Date }) {
  const { de, ate, dias } = useMemo(() => janelaMes(referencia), [referencia])
  const { data, isLoading } = useAgendaOrdens(de, ate)
  const ordens = data ?? []

  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null)

  const ordensDoDia = (dia: Date) =>
    ordens
      .filter((o) => o.dataAgendamentoInicio && isSameDay(new Date(o.dataAgendamentoInicio), dia))
      .sort(porHora)

  // Quebra os dias em linhas de 7 (semanas).
  const semanas = useMemo(() => {
    const linhas: Date[][] = []
    for (let i = 0; i < dias.length; i += 7) linhas.push(dias.slice(i, i + 7))
    return linhas
  }, [dias])

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-px">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {semanas.map((semana, li) => (
          <div key={li} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {semana.map((dia) => {
              const doDia = ordensDoDia(dia)
              const noMes = isSameMonth(dia, referencia)
              const hoje = isToday(dia)
              const label = format(dia, "EEEE, d 'de' MMMM", { locale: ptBR })

              return (
                <button
                  key={dia.toISOString()}
                  type="button"
                  aria-label={label}
                  onClick={() => setDiaSelecionado(dia)}
                  className={cn(
                    'flex min-h-[7.5rem] flex-col gap-1 border-r border-border p-1.5 text-left last:border-r-0',
                    'transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    !noMes && 'bg-muted/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center self-end rounded-full text-xs font-semibold tabular-nums',
                      hoje && 'bg-primary text-primary-foreground',
                      !hoje && noMes && 'text-foreground',
                      !hoje && !noMes && 'text-muted-foreground',
                    )}
                  >
                    {format(dia, 'd')}
                  </span>

                  {isLoading ? (
                    <Skeleton className="h-5 w-full rounded-md" />
                  ) : (
                    <div className="flex flex-col gap-1">
                      {doDia.slice(0, MAX_CHIPS).map((o) => (
                        <Chip key={o.id} ordem={o} />
                      ))}
                      {doDia.length > MAX_CHIPS && (
                        <span className="rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                          +{doDia.length - MAX_CHIPS}{' '}
                          {doDia.length - MAX_CHIPS === 1 ? 'agendamento' : 'agendamentos'}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <DiaAgendaSheet
        dia={diaSelecionado}
        ordens={diaSelecionado ? ordensDoDia(diaSelecionado) : []}
        onOpenChange={(aberto) => !aberto && setDiaSelecionado(null)}
      />
    </div>
  )
}

/**
 * Chip compacto de uma OS dentro da célula do dia (não interativo). Pílula com
 * fundo suave na cor do status — hora em destaque + nome do cliente. O nome
 * longo é truncado com reticências; o `title` mostra o texto completo no hover
 * e o painel lateral (clique na célula) traz a informação inteira.
 */
function Chip({ ordem }: { ordem: AgendaOrdemDto }) {
  const hora = ordem.dataAgendamentoInicio
    ? format(new Date(ordem.dataAgendamentoInicio), 'HH:mm')
    : '--:--'
  const meta = ordem.status ? STATUS_ORDEM_META[ordem.status as StatusOrdem] : undefined
  const cliente = ordem.clienteNome ?? 'Sem cliente'

  return (
    <span
      title={`${hora} · ${cliente}`}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs leading-tight',
        meta?.badgeClass ?? 'bg-secondary text-foreground',
      )}
    >
      <span className="shrink-0 font-semibold tabular-nums">{hora}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{cliente}</span>
    </span>
  )
}
