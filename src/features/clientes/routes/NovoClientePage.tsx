import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { ClienteForm } from '../components/ClienteForm'
import { useCriarCliente } from '../hooks/useCriarCliente'

export function NovoClientePage() {
  const navigate = useNavigate()
  const criar = useCriarCliente()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Novo cliente"
        description="Preencha os dados para cadastrar."
        actions={
          <Button asChild variant="outline">
            <Link to="/clientes">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl rounded-md border bg-card p-6">
        <ClienteForm
          submitLabel="Cadastrar"
          onCancel={() => navigate('/clientes')}
          onSubmit={async (values) => {
            try {
              const { id } = await criar.mutateAsync(values)
              toast.success('Cliente cadastrado com sucesso.')
              navigate(`/clientes/${id}`, { replace: true })
            } catch (err) {
              const apiErr = err as { kind?: string; message?: string }
              if (apiErr.kind !== 'validation') {
                toast.error(apiErr.message ?? 'Não foi possível cadastrar.')
              }
              throw err
            }
          }}
        />
      </div>
    </div>
  )
}
