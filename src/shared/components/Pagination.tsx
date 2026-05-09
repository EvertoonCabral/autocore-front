import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaginationProps {
  pagina: number
  porPagina: number
  total: number
  onPaginaChange: (pagina: number) => void
  onPorPaginaChange?: (porPagina: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  pagina,
  porPagina,
  total,
  onPaginaChange,
  onPorPaginaChange,
  pageSizeOptions = [10, 20, 50],
}: PaginationProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1
  const fim = Math.min(pagina * porPagina, total)

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground" role="status">
        {total === 0 ? 'Nenhum registro' : `${inicio}–${fim} de ${total}`}
      </p>
      <div className="flex items-center gap-3">
        {onPorPaginaChange && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Por página</span>
            <Select
              value={String(porPagina)}
              onValueChange={(v) => onPorPaginaChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={pagina <= 1}
            onClick={() => onPaginaChange(pagina - 1)}
            aria-label="Página anterior"
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-sm tabular-nums">
            {pagina} / {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={pagina >= totalPaginas}
            onClick={() => onPaginaChange(pagina + 1)}
            aria-label="Próxima página"
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
