import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/shared/components/PageHeader'
import { ClienteForm } from '../components/ClienteForm'
import { useObterCliente } from '../hooks/useObterCliente'
import { useAtualizarCliente } from '../hooks/useAtualizarCliente'

export function EditarClientePage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()

  const { data: cliente, isLoading, isError } = useObterCliente(numericId)
  const atualizar = useAtualizarCliente()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Editar cliente"
        description={cliente?.nome ?? undefined}
        actions={
          <Button asChild variant="outline">
            <Link to={`/clientes/${numericId}`}>
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
        ) : isError || !cliente ? (
          <p className="text-sm text-destructive">Cliente não encontrado.</p>
        ) : (
          <ClienteForm
            submitLabel="Salvar alterações"
            onCancel={() => navigate(`/clientes/${numericId}`)}
            defaultValues={{
              nome: cliente.nome ?? '',
              telefone: cliente.telefone ?? '',
              email: cliente.email ?? '',
              cpf: cliente.cpf ?? '',
              endereco: cliente.endereco ?? '',
            }}
            onSubmit={async (values) => {
              try {
                await atualizar.mutateAsync({ id: numericId, values })
                toast.success('Cliente atualizado.')
                navigate(`/clientes/${numericId}`)
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
