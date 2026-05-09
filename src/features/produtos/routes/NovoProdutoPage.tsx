import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { ProdutoForm } from '../components/ProdutoForm'
import { useCriarProduto } from '../hooks/useCriarProduto'

export function NovoProdutoPage() {
  const navigate = useNavigate()
  const criar = useCriarProduto()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Novo produto"
        description="Cadastre um item de estoque."
        actions={
          <Button asChild variant="outline">
            <Link to="/produtos">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl rounded-md border bg-card p-6">
        <ProdutoForm
          submitLabel="Cadastrar"
          onCancel={() => navigate('/produtos')}
          onSubmit={async (values) => {
            try {
              const { id } = await criar.mutateAsync(values)
              toast.success('Produto cadastrado.')
              navigate(`/produtos/${id}`, { replace: true })
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
