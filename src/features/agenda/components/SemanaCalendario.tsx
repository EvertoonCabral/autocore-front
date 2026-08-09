import { useMemo, useState } from 'react'
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
  subWeeks,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AgendaOrdemDto } from '@/api/types'
import { useAgendaOrdens } from '../hooks/useAgendaOrdens'
import { AgendaCard } from './AgendaCard'

/** Semana começa na segunda-feira (weekStartsOn: 1). */
const WEEK_OPTS = { weekStartsOn: 1 } as const

/** Ordena por data/hora de agendamento crescente. */
function porHora(a: AgendaOrdemDto, b: AgendaOrdemDto): number {
  return (a.dataAgendamentoInicio ?? '').localeCompare(b.dataAgendamentoInicio ?? '')
}

/**
 * Grade semanal (7 colunas seg…dom) construída com date-fns — sem biblioteca
 * de calendário. Cada coluna lista as OS agendadas do dia, ordenadas por hora.
 * A janela consultada (`de`/`ate`) usa datas locais `yyyy-MM-dd`.
 */
export function SemanaCalendario() {
  const [referencia, setReferencia] = useState(() => new Date())

  const inicioSemana = useMemo(() => startOfWeek(referencia, WEEK_OPTS), [referencia])
  const fimSemana = useMemo(() => endOfWeek(referencia, WEEK_OPTS), [referencia])
  const dias = useMemo(
    () => eachDayOfInterval({ start: inicioSemana, end: fimSemana }),
    [inicioSemana, fimSemana],
  )

  const de = format(inicioSemana, 'yyyy-MM-dd')
  const ate = format(fimSemana, 'yyyy-MM-dd')

  const { data, isLoading } = useAgendaOrdens(de, ate)
  const ordens = data ?? []

  const rangeLabel = `${format(inicioSemana, "d 'de' MMM", { locale: ptBR })} – ${format(
    fimSemana,
    "d 'de' MMM 'de' yyyy",
    { locale: ptBR },
  )}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{rangeLabel}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Semana anterior"
            onClick={() => setReferencia((d) => subWeeks(d, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setReferencia(new Date())}>
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Próxima semana"
            onClick={() => setReferencia((d) => addWeeks(d, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
    </div>
  )
}
