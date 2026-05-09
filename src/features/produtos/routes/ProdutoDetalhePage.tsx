import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/shared/components/PageHeader'
import { Can } from '@/shared/components/Can'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { formatBRL } from '@/lib/format'
import { AjustarEstoqueDialog } from '../components/AjustarEstoqueDialog'
import { useObterProduto } from '../hooks/useObterProduto'
import { useDesativarProduto } from '../hooks/useDesativarProduto'

export function ProdutoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()

  const { data: produto, isLoading, isError } = useObterProduto(numericId)
  const desativar = useDesativarProduto()

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full max-w-2xl" />
      </div>
    )
  }

  if (isError || !produto) {
    return (
      <div className="space-y-3">
        <Button asChild variant="outline">
          <Link to="/produtos">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <p className="text-sm text-destructive">Produto não encontrado.</p>
      </div>
    )
  }

  const isAtivo = produto.ativo ?? true
  const abaixoMinimo = (produto.quantidadeEstoque ?? 0) < (produto.estoqueMinimo ?? 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title={produto.nome ?? '(sem nome)'}
        description={
          <span className="flex items-center gap-2">
            <span>Produto #{produto.id}</span>
            {!isAtivo && <Badge variant="secondary">Inativo</Badge>}
            {isAtivo && abaixoMinimo && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3" />
                Abaixo do mínimo
              </Badge>
            )}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/produtos">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            {isAtivo && (
              <AjustarEstoqueDialog
                produto={{
                  id: numericId,
                  nome: produto.nome ?? '',
                  quantidadeEstoque: produto.quantidadeEstoque ?? 0,
                }}
              />
            )}
            {isAtivo && (
              <Button asChild>
                <Link to={`/produtos/${numericId}/editar`}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
            )}
            {isAtivo && (
              <Can permission="produtos.desativar">
                <ConfirmDialog
                  trigger={
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4" />
                      Desativar
                    </Button>
                  }
                  title="Desativar produto?"
                  description={
                    <span>
                      O produto <strong>{produto.nome}</strong> ficará indisponível para novas
                      OSs. Itens já adicionados a OSs preservam o snapshot.
                    </span>
                  }
                  confirmLabel="Desativar"
                  variant="destructive"
                  pending={desativar.isPending}
                  onConfirm={async () => {
                    try {
                      await desativar.mutateAsync(numericId)
                      toast.success('Produto desativado.')
                      navigate('/produtos')
                    } catch (err) {
                      const apiErr = err as { message?: string }
                      toast.error(apiErr.message ?? 'Não foi possível desativar.')
                    }
                  }}
                />
              </Can>
            )}
          </div>
        }
      />

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-md border bg-card p-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Referência</dt>
          <dd className="text-base">{produto.referencia ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Estoque atual</dt>
          <dd className={`text-base tabular-nums ${abaixoMinimo ? 'text-destructive font-medium' : ''}`}>
            {produto.quantidadeEstoque} <span className="text-muted-foreground">unidades</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Estoque mínimo</dt>
          <dd className="text-base tabular-nums">{produto.estoqueMinimo}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Preço de custo</dt>
          <dd className="text-base tabular-nums">{formatBRL(produto.precoCusto ?? 0)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Preço de venda</dt>
          <dd className="text-base tabular-nums">{formatBRL(produto.precoVenda ?? 0)}</dd>
        </div>
      </dl>
    </div>
  )
}
