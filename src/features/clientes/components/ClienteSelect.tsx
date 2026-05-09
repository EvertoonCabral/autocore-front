import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useListarClientes } from '../hooks/useListarClientes'

interface Props {
  value: number | undefined
  onChange: (clienteId: number) => void
  placeholder?: string
  /** Mostra apenas clientes ativos. Default: true (regra de Abrir OS no back). */
  somenteAtivos?: boolean
}

/**
 * Select de cliente com busca embutida (filtro vai pro back via `useListarClientes`).
 * Usado no fluxo de Abrir OS — onde o cliente precisa estar ativo.
 */
export function ClienteSelect({
  value,
  onChange,
  placeholder = 'Selecione um cliente…',
  somenteAtivos = true,
}: Props) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useListarClientes({
    pagina: 1,
    porPagina: 50,
    incluirInativos: !somenteAtivos,
    ...(debouncedSearch ? { filtro: debouncedSearch } : {}),
  })

  const opcoes = (data?.dados ?? []).filter((c) => (somenteAtivos ? c.ativo : true))

  return (
    <Select
      {...(value ? { value: String(value) } : {})}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <Input
            placeholder="Buscar por nome ou telefone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8"
          />
        </div>
        <SelectGroup>
          <SelectLabel className="px-2">
            {isLoading
              ? 'Buscando…'
              : opcoes.length === 0
                ? 'Nenhum cliente encontrado'
                : `${opcoes.length} cliente(s)`}
          </SelectLabel>
          {opcoes.map((c) => (
            <SelectItem key={c.id ?? `cli-${c.nome}`} value={String(c.id)}>
              <span className="flex flex-col">
                <span className="font-medium">{c.nome}</span>
                <span className="text-xs text-muted-foreground">{c.telefone}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
