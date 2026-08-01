import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/shared/components/PageHeader'
import { VeiculoForm } from '../components/VeiculoForm'
import { useObterVeiculo } from '../hooks/useObterVeiculo'
import { useAtualizarVeiculo } from '../hooks/useAtualizarVeiculo'

export function EditarVeiculoPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()

  const { data: veiculo, isLoading, isError } = useObterVeiculo(numericId)
  const atualizar = useAtualizarVeiculo()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Editar veículo"
        description={veiculo?.placa ?? undefined}
        actions={
          <Button asChild variant="outline">
            <Link to={`/veiculos/${numericId}`}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl rounded-md border bg-card p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError || !veiculo ? (
          <p className="text-sm text-destructive">Veículo não encontrado.</p>
        ) : (
          <VeiculoForm
            modoEdicao
            clienteNome={veiculo.clienteNome}
            submitLabel="Salvar alterações"
            onCancel={() => navigate(`/veiculos/${numericId}`)}
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
                navigate(`/veiculos/${numericId}`)
              } catch (err) {
                const apiErr = err as { kind?: string; message?: string }
                if (apiErr.kind !== 'validation') {
                  toast.error(apiErr.message ?? 'Não foi possível salvar.')
                }
                throw err
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
