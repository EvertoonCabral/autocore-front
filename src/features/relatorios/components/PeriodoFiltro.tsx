import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  de: string
  ate: string
  onChange: (key: 'de' | 'ate', value: string) => void
  /** Slot extra à direita (ex.: Select de forma de pagamento, botão CSV). */
  extra?: ReactNode
}

/**
 * Barra de filtro por período (De / Até) usada nas páginas de relatório.
 * Datas em `yyyy-MM-dd` (input nativo). Vazio = back assume hoje.
 */
export function PeriodoFiltro({ de, ate, onChange, extra }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-md border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="rel-de">De</Label>
        <Input
          id="rel-de"
          type="date"
          value={de}
          onChange={(e) => onChange('de', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rel-ate">Até</Label>
        <Input
          id="rel-ate"
          type="date"
          value={ate}
          onChange={(e) => onChange('ate', e.target.value)}
        />
      </div>
      {extra}
    </div>
  )
}
