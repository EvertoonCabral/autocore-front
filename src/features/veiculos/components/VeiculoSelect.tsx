import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useListarVeiculosDoCliente } from '../hooks/useListarVeiculosDoCliente'

interface Props {
  /** Cliente dono dos veículos. Sem ele o select fica desabilitado/vazio. */
  clienteId?: number | undefined
  value: number | undefined
  onChange: (veiculoId: number) => void
  disabled?: boolean | undefined
}

/**
 * Select dos veículos ATIVOS de um cliente (usado no fluxo de OS). O label da
 * opção é `placa` + (modelo ? ` — ${modelo}` : '').
 */
export function VeiculoSelect({ clienteId, value, onChange, disabled }: Props) {
  const { data, isLoading } = useListarVeiculosDoCliente(clienteId)

  const opcoes = data ?? []
  const semCliente = !clienteId
  const desabilitado = disabled || semCliente

  const placeholder = semCliente ? 'Selecione um cliente primeiro…' : 'Selecione um veículo…'

  return (
    <Select
      {...(value ? { value: String(value) } : {})}
      onValueChange={(v) => onChange(Number(v))}
      disabled={desabilitado}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="px-2">
            {isLoading
              ? 'Buscando…'
              : opcoes.length === 0
                ? 'Nenhum veículo ativo'
                : `${opcoes.length} veículo(s)`}
          </SelectLabel>
          {opcoes.map((v) => (
            <SelectItem key={v.id ?? `vei-${v.placa}`} value={String(v.id)}>
              <span className="flex flex-col">
                <span className="font-medium tabular-nums">{v.placa}</span>
                {v.modelo && (
                  <span className="text-xs text-muted-foreground">{v.modelo}</span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
