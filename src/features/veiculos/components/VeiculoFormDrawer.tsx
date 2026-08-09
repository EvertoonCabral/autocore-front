import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { FormDrawerShell } from '@/shared/components/FormDrawerShell'
import type { ConflitoPlacaDto } from '@/api/types'
import { VeiculoForm } from './VeiculoForm'
import { ConfirmarTransferenciaDialog } from './ConfirmarTransferenciaDialog'
import type { VeiculoFormValues } from '../helpers/veiculoSchema'
import { useCriarVeiculo, isConflitoPlacaError } from '../hooks/useCriarVeiculo'
import { useAtualizarVeiculo } from '../hooks/useAtualizarVeiculo'
import { useObterVeiculo } from '../hooks/useObterVeiculo'

interface Props {
  mode: 'criar' | 'editar'
}

/**
 * Drawer (Sheet) de cadastro/edição de veículo sobre a lista. Preserva o fluxo
 * de transferência de placa (HTTP 409) na criação e o dono read-only na edição.
 */
export function VeiculoFormDrawer({ mode }: Props) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const [dirty, setDirty] = useState(false)

  const criar = useCriarVeiculo()
  const atualizar = useAtualizarVeiculo()
  const { data: veiculo, isLoading, isError } = useObterVeiculo(
    mode === 'editar' ? numericId : undefined,
  )

  const [conflito, setConflito] = useState<ConflitoPlacaDto | null>(null)
  // Guarda os valores do form para reenviar ao confirmar a transferência.
  const pendenteRef = useRef<VeiculoFormValues | null>(null)

  const fechar = () => navigate('/veiculos')

  async function criarComToast(
    values: VeiculoFormValues,
    extra?: { confirmarSubstituicao: boolean; motivoDesativacaoAnterior: string },
  ) {
    await criar.mutateAsync({ ...values, ...(extra ?? {}) })
    toast.success('Veículo cadastrado com sucesso.')
    setDirty(false)
    fechar()
  }

  const carregandoEdicao = mode === 'editar' && isLoading
  const erroEdicao = mode === 'editar' && (isError || !veiculo)

  return (
    <FormDrawerShell
      title={mode === 'criar' ? 'Novo veículo' : 'Editar veículo'}
      description={mode === 'criar' ? 'Preencha os dados para cadastrar.' : (veiculo?.placa ?? undefined)}
      dirty={dirty}
      onClose={fechar}
    >
      {carregandoEdicao ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : erroEdicao ? (
        <p className="text-sm text-destructive">Veículo não encontrado.</p>
      ) : mode === 'editar' && veiculo ? (
        <VeiculoForm
          modoEdicao
          clienteNome={veiculo.clienteNome}
          submitLabel="Salvar alterações"
          onCancel={fechar}
          onDirtyChange={setDirty}
          defaultValues={{
            clienteId: veiculo.clienteId!,
            placa: veiculo.placa ?? '',
            marca: veiculo.marca ?? '',
            modelo: veiculo.modelo ?? '',
            anoFabricacao: veiculo.anoFabricacao ?? null,
            anoModelo: veiculo.anoModelo ?? null,
            cor: veiculo.cor ?? '',
            chassi: veiculo.chassi ?? '',
            renavam: veiculo.renavam ?? '',
            observacoes: veiculo.observacoes ?? '',
          }}
          onSubmit={async (values) => {
            try {
              await atualizar.mutateAsync({ id: numericId, values })
              toast.success('Veículo atualizado.')
              setDirty(false)
              fechar()
            } catch (err) {
              const apiErr = err as { kind?: string; message?: string }
              if (apiErr.kind !== 'validation') {
                toast.error(apiErr.message ?? 'Não foi possível salvar.')
              }
              throw err
            }
          }}
        />
      ) : (
        <VeiculoForm
          submitLabel="Cadastrar"
          onCancel={fechar}
          onDirtyChange={setDirty}
          onSubmit={async (values) => {
            try {
              await criarComToast(values)
            } catch (err) {
              // Conflito de placa (409): abre o diálogo de transferência.
              if (isConflitoPlacaError(err)) {
                pendenteRef.current = values
                setConflito(err.conflito)
                return
              }
              // Validação (422): re-lança para o form distribuir nos campos.
              const apiErr = err as { kind?: string; message?: string }
              if (apiErr.kind === 'validation') throw err
              toast.error(apiErr.message ?? 'Não foi possível cadastrar.')
            }
          }}
        />
      )}

      <ConfirmarTransferenciaDialog
        open={!!conflito}
        onOpenChange={(open) => {
          if (!open) setConflito(null)
        }}
        conflito={conflito}
        pending={criar.isPending}
        onConfirmar={async (motivo) => {
          const values = pendenteRef.current
          if (!values) return
          try {
            await criarComToast(values, {
              confirmarSubstituicao: true,
              motivoDesativacaoAnterior: motivo,
            })
            setConflito(null)
          } catch (err) {
            const apiErr = err as { message?: string }
            toast.error(apiErr.message ?? 'Não foi possível transferir o veículo.')
          }
        }}
      />
    </FormDrawerShell>
  )
}
