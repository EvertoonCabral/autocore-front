import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { FormDrawerShell } from '@/shared/components/FormDrawerShell'
import { ProdutoForm } from './ProdutoForm'
import { useCriarProduto } from '../hooks/useCriarProduto'
import { useAtualizarProduto } from '../hooks/useAtualizarProduto'
import { useObterProduto } from '../hooks/useObterProduto'

interface Props {
  mode: 'criar' | 'editar'
}

/** Drawer (Sheet) de cadastro/edição de produto sobre a lista. */
export function ProdutoFormDrawer({ mode }: Props) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const [dirty, setDirty] = useState(false)

  const criar = useCriarProduto()
  const atualizar = useAtualizarProduto()
  const { data: produto, isLoading, isError } = useObterProduto(
    mode === 'editar' ? numericId : undefined,
  )

  const fechar = () => navigate('/produtos')

  // Identidade estável dos valores iniciais (só muda quando o produto carregado
  // muda). Evita que o `reset(defaultValues)` do form dispare a cada render do
  // drawer (que re-renderiza ao digitar, via onDirtyChange) e reverta o valor
  // digitado em modo edição.
  const defaultValues = useMemo(
    () =>
      produto
        ? {
            nome: produto.nome ?? '',
            referencia: produto.referencia ?? '',
            precoCusto: produto.precoCusto ?? 0,
            precoVenda: produto.precoVenda ?? 0,
            quantidadeEstoque: produto.quantidadeEstoque ?? 0,
            estoqueMinimo: produto.estoqueMinimo ?? 0,
          }
        : undefined,
    [produto],
  )

  return (
    <FormDrawerShell
      title={mode === 'criar' ? 'Novo produto' : 'Editar produto'}
      description={mode === 'criar' ? 'Cadastre um item de estoque.' : (produto?.nome ?? undefined)}
      dirty={dirty}
      onClose={fechar}
    >
      {mode === 'editar' && isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : mode === 'editar' && (isError || !produto) ? (
        <p className="text-sm text-destructive">Produto não encontrado.</p>
      ) : (
        <>
          <ProdutoForm
            submitLabel={mode === 'criar' ? 'Cadastrar' : 'Salvar alterações'}
            esconderEstoqueInicial={mode === 'editar'}
            onCancel={fechar}
            onDirtyChange={setDirty}
            {...(mode === 'editar' && defaultValues ? { defaultValues } : {})}
            onSubmit={async (values) => {
              try {
                if (mode === 'criar') {
                  await criar.mutateAsync(values)
                  toast.success('Produto cadastrado.')
                } else {
                  await atualizar.mutateAsync({
                    id: numericId,
                    values: { ...values, quantidadeEstoque: produto?.quantidadeEstoque ?? 0 },
                  })
                  toast.success('Produto atualizado.')
                }
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
          {mode === 'editar' && (
            <p className="mt-4 text-xs text-muted-foreground">
              Para alterar a quantidade em estoque, use o botão <strong>Ajustar estoque</strong> na
              tela de detalhe — o registro do ajuste preserva o histórico no back.
            </p>
          )}
        </>
      )}
    </FormDrawerShell>
  )
}
