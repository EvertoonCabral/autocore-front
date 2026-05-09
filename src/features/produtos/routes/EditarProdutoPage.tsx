import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/shared/components/PageHeader'
import { ProdutoForm } from '../components/ProdutoForm'
import { useObterProduto } from '../hooks/useObterProduto'
import { useAtualizarProduto } from '../hooks/useAtualizarProduto'

export function EditarProdutoPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()

  const { data: produto, isLoading, isError } = useObterProduto(numericId)
  const atualizar = useAtualizarProduto()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Editar produto"
        description={produto?.nome ?? undefined}
        actions={
          <Button asChild variant="outline">
            <Link to={`/produtos/${numericId}`}>
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
        ) : isError || !produto ? (
          <p className="text-sm text-destructive">Produto não encontrado.</p>
        ) : (
          <ProdutoForm
            submitLabel="Salvar alterações"
            esconderEstoqueInicial
            onCancel={() => navigate(`/produtos/${numericId}`)}
            defaultValues={{
              nome: produto.nome ?? '',
              referencia: produto.referencia ?? '',
              precoCusto: produto.precoCusto ?? 0,
              precoVenda: produto.precoVenda ?? 0,
              quantidadeEstoque: produto.quantidadeEstoque ?? 0,
              estoqueMinimo: produto.estoqueMinimo ?? 0,
            }}
            onSubmit={async (values) => {
              try {
                await atualizar.mutateAsync({
                  id: numericId,
                  values: { ...values, quantidadeEstoque: produto.quantidadeEstoque ?? 0 },
                })
                toast.success('Produto atualizado.')
                navigate(`/produtos/${numericId}`)
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
      <p className="text-xs text-muted-foreground">
        Para alterar a quantidade em estoque, use o botão <strong>Ajustar estoque</strong> na
        tela de detalhe — o registro do ajuste preserva o histórico no back.
      </p>
    </div>
  )
}
