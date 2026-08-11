import {
  addMonths,
  addWeeks,
  format,
  getMonth,
  getYear,
  setMonth,
  setYear,
  subMonths,
  subWeeks,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { janelaSemana } from '../helpers/janela'

export type ModoAgenda = 'semana' | 'mes'

interface Props {
  modo: ModoAgenda
  referencia: Date
  onModoChange: (modo: ModoAgenda) => void
  onReferenciaChange: (referencia: Date) => void
}

/** 12 meses com label PT-BR (capitalizado), índice 0–11. */
const MESES = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: format(setMonth(new Date(2000, 0, 1), i), 'MMMM', { locale: ptBR }),
}))

/** Rótulo do intervalo exibido, conforme o modo. */
function rangeLabel(modo: ModoAgenda, referencia: Date): string {
  if (modo === 'mes') {
    return format(referencia, "MMMM 'de' yyyy", { locale: ptBR })
  }
  const { inicio, fim } = janelaSemana(referencia)
  return `${format(inicio, "d 'de' MMM", { locale: ptBR })} – ${format(
    fim,
    "d 'de' MMM 'de' yyyy",
    { locale: ptBR },
  )}`
}

/**
 * Barra de controle da Agenda: alterna Semana/Mês, navega para trás/frente
 * (passo por semana ou mês conforme o modo) e permite saltar para um mês/ano
 * arbitrário — para consultar datas passadas ou futuras.
 */
export function AgendaToolbar({ modo, referencia, onModoChange, onReferenciaChange }: Props) {
  const anoAtual = getYear(new Date())
  const anos = Array.from({ length: 9 }, (_, i) => anoAtual - 5 + i) // atual-5 … atual+3

  const passo = modo === 'mes' ? { sub: subMonths, add: addMonths } : { sub: subWeeks, add: addWeeks }
  const labelAnterior = modo === 'mes' ? 'Mês anterior' : 'Semana anterior'
  const labelProximo = modo === 'mes' ? 'Próximo mês' : 'Próxima semana'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={modo} onValueChange={(v) => onModoChange(v as ModoAgenda)}>
          <TabsList>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-sm font-medium capitalize text-foreground">{rangeLabel(modo, referencia)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={String(getMonth(referencia))}
          onValueChange={(v) => onReferenciaChange(setMonth(referencia, Number(v)))}
        >
          <SelectTrigger className="h-9 w-[9.5rem] capitalize" aria-label="Mês">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m) => (
              <SelectItem key={m.value} value={String(m.value)} className="capitalize">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(getYear(referencia))}
          onValueChange={(v) => onReferenciaChange(setYear(referencia, Number(v)))}
        >
          <SelectTrigger className="h-9 w-[5.5rem]" aria-label="Ano">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anos.map((a) => (
              <SelectItem key={a} value={String(a)}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          aria-label={labelAnterior}
          onClick={() => onReferenciaChange(passo.sub(referencia, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onReferenciaChange(new Date())}>
          Hoje
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-label={labelProximo}
          onClick={() => onReferenciaChange(passo.add(referencia, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
