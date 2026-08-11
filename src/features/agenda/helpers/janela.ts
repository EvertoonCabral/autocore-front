import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { AgendaOrdemDto } from '@/api/types'

/** Ordena OS por data/hora de agendamento crescente. */
export function porHora(a: AgendaOrdemDto, b: AgendaOrdemDto): number {
  return (a.dataAgendamentoInicio ?? '').localeCompare(b.dataAgendamentoInicio ?? '')
}

/** Semana começa na segunda-feira (weekStartsOn: 1). */
export const WEEK_OPTS = { weekStartsOn: 1 } as const

/**
 * Janela consultada na API a partir de uma data de referência.
 * `de`/`ate` são datas de calendário LOCAIS (`yyyy-MM-dd`) — o back converte
 * para UTC via America/Sao_Paulo. `dias` é a lista de dias a renderizar na grade.
 */
export interface Janela {
  de: string
  ate: string
  dias: Date[]
  inicio: Date
  fim: Date
}

function montar(inicio: Date, fim: Date): Janela {
  return {
    inicio,
    fim,
    de: format(inicio, 'yyyy-MM-dd'),
    ate: format(fim, 'yyyy-MM-dd'),
    dias: eachDayOfInterval({ start: inicio, end: fim }),
  }
}

/** Janela da semana (seg…dom) que contém `referencia`. */
export function janelaSemana(referencia: Date): Janela {
  return montar(startOfWeek(referencia, WEEK_OPTS), endOfWeek(referencia, WEEK_OPTS))
}

/**
 * Janela da grade mensal: do início da semana do 1º dia do mês até o fim da
 * semana do último dia — cobre os ~35/42 dias exibidos, inclusive os dias de
 * meses vizinhos que aparecem nas bordas da grade.
 */
export function janelaMes(referencia: Date): Janela {
  const inicio = startOfWeek(startOfMonth(referencia), WEEK_OPTS)
  const fim = endOfWeek(endOfMonth(referencia), WEEK_OPTS)
  return montar(inicio, fim)
}
