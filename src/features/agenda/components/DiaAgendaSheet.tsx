import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { AgendaOrdemDto } from '@/api/types'
import { AgendaCard } from './AgendaCard'

interface Props {
  /** Dia selecionado; `null` mantém o painel fechado. */
  dia: Date | null
  /** OS agendadas do dia, já ordenadas por hora. */
  ordens: AgendaOrdemDto[]
  onOpenChange: (aberto: boolean) => void
}

/**
 * Painel lateral (drawer) com as OS agendadas de um dia. Reusa o `AgendaCard`
 * — clicar numa OS navega para `/ordens/{id}`, mesmo comportamento da grade.
 */
export function DiaAgendaSheet({ dia, ordens, onOpenChange }: Props) {
  return (
    <Sheet open={dia != null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm overflow-y-auto sm:w-96">
        <SheetHeader>
          <SheetTitle className="capitalize">
            {dia ? format(dia, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}
          </SheetTitle>
          <SheetDescription>
            {ordens.length === 0
              ? 'Sem agendamentos'
              : `${ordens.length} ${ordens.length === 1 ? 'ordem agendada' : 'ordens agendadas'}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 p-4 pt-0">
          {ordens.map((o) => (
            <AgendaCard key={o.id} ordem={o} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
