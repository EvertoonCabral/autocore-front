import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/shared/hooks/useDebounce'

interface SearchInputProps {
  /** Valor inicial / valor controlado externamente (ex.: vindo de URL). */
  value: string
  /** Disparado após o debounce — é onde você atualiza a query. */
  onDebouncedChange: (value: string) => void
  placeholder?: string
  delayMs?: number
  className?: string
}

/** Input com ícone de busca, debounce e botão "limpar". */
export function SearchInput({
  value,
  onDebouncedChange,
  placeholder = 'Buscar…',
  delayMs = 300,
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value)
  const debounced = useDebounce(local, delayMs)

  // sincroniza valor externo (ex.: voltar pela URL) sem disparar debounce
  useEffect(() => setLocal(value), [value])

  // dispara ao usuário fora do prazo de debounce
  useEffect(() => {
    if (debounced !== value) onDebouncedChange(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <div className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={local}
          placeholder={placeholder}
          className="pl-9 pr-9"
          onChange={(e) => setLocal(e.target.value)}
        />
        {local && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Limpar busca"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={() => setLocal('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
