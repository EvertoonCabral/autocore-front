import { useMemo } from 'react'
import { format, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/cn'
import { Skeleton } from '@/components/ui/skeleton'
import { useAgendaOrdens } from '../hooks/useAgendaOrdens'
import { janelaSemana, porHora } from '../helpers/janela'
import { AgendaCard } from './AgendaCard'

interface Props {
  referencia: Date
}

/**
 * Grade semanal (7 colunas seg…dom) construída com date-fns — sem biblioteca
 * de calendário. Cada coluna lista as OS agendadas do dia, ordenadas por hora.
 * Apresentacional: a data de referência e a navegação vêm da `AgendaToolbar`.
 */
export function SemanaCalendario({ referencia }: Props) {
  const { de, ate, dias } = useMemo(() => janelaSemana(referencia), [referencia])

  const { data, isLoading } = useAgendaOrdens(de, ate)
  const ordens = data ?? []

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {dias.map((dia) => {
        const doDia = ordens
          .filter((o) => o.dataAgendamentoInicio && isSameDay(new Date(o.dataAgendamentoInicio), dia))
          .sort(porHora)
        const hoje = isToday(dia)

        return (
          <section
            key={dia.toISOString()}
            aria-label={format(dia, "EEEE, d 'de' MMMM", { locale: ptBR })}
            className={cn(
              'flex min-h-[8rem] flex-col rounded-xl border border-border bg-secondary',
              hoje && 'ring-2 ring-ring',
            )}
          >
            <header className="flex items-baseline justify-between gap-1 border-b border-border-faint px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {format(dia, 'EEE', { locale: ptBR })}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  hoje ? 'text-primary' : 'text-foreground',
                )}
              >
                {format(dia, 'dd/MM')}
              </span>
            </header>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {isLoading ? (
                <Skeleton className="h-[68px] w-full rounded-lg" />
              ) : doDia.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">Sem agendamentos</p>
              ) : (
                doDia.map((o) => <AgendaCard key={o.id} ordem={o} />)
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
