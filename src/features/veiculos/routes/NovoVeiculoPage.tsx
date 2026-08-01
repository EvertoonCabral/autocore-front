import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import type { ConflitoPlacaDto } from '@/api/types'
import { VeiculoForm } from '../components/VeiculoForm'
import { ConfirmarTransferenciaDialog } from '../components/ConfirmarTransferenciaDialog'
import { useCriarVeiculo, isConflitoPlacaError } from '../hooks/useCriarVeiculo'
import type { VeiculoFormValues } from '../helpers/veiculoSchema'

export function NovoVeiculoPage() {
  const navigate = useNavigate()
  const criar = useCriarVeiculo()

  const [conflito, setConflito] = useState<ConflitoPlacaDto | null>(null)
  // Guarda os valores do form para reenviar ao confirmar a transferência.
  const pendenteRef = useRef<VeiculoFormValues | null>(null)

  async function criarComToast(
    values: VeiculoFormValues,
    extra?: { confirmarSubstituicao: boolean; motivoDesativacaoAnterior: string },
  ) {
    const { id } = await criar.mutateAsync({ ...values, ...(extra ?? {}) })
    toast.success('Veículo cadastrado com sucesso.')
    navigate(`/veiculos/${id}`, { replace: true })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Novo veículo"
        description="Preencha os dados para cadastrar."
        actions={
          <Button asChild variant="outline">
            <Link to="/veiculos">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl rounded-md border bg-card p-6">
        <VeiculoForm
          submitLabel="Cadastrar"
          onCancel={() => navigate('/veiculos')}
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
      </div>

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
    </div>
  )
}
