import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageHeader } from '@/shared/components/PageHeader'
import { useCan } from '@/shared/components/Can'
import type { CatalogoServicoDto } from '@/api/types'
import { ServicoForm } from '../components/ServicoForm'
import type { ServicoFormValues } from '../helpers/servicoSchema'
import { useObterServico } from '../hooks/useObterServico'
import { useListarServicos } from '../hooks/useListarServicos'
import { useAtualizarServico } from '../hooks/useAtualizarServico'

export function EditarServicoPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()
  const podeAtualizarPreco = useCan('servicos.atualizarPreco')

  const { data: servico, isLoading, isError } = useObterServico(numericId)
  const { data: lista } = useListarServicos(false)
  const atualizar = useAtualizarServico()

  const [pendente, setPendente] = useState<{
    values: ServicoFormValues
    padraoAtual: CatalogoServicoDto
  } | null>(null)

  async function persistir(values: ServicoFormValues) {
    if (!servico || servico.id == null) return
    // Operador não pode alterar preço: mantém o atual.
    const precoFinal = podeAtualizarPreco ? values.preco : (servico.preco ?? 0)
    try {
      await atualizar.mutateAsync({
        id: servico.id,
        values: { ...values, preco: precoFinal },
      })
      toast.success('Serviço atualizado.')
      navigate(`/servicos/${servico.id}`)
    } catch (err) {
      const apiErr = err as { kind?: string; message?: string }
      if (apiErr.kind !== 'validation') {
        toast.error(apiErr.message ?? 'Não foi possível salvar.')
      }
      throw err
    }
  }

  function detectarConflito(values: ServicoFormValues): CatalogoServicoDto | null {
    if (!values.ehMaoDeObraPadrao) return null
    if (!servico) return null
    const padraoAtual = (lista ?? []).find(
      (s) => s.ehMaoDeObraPadrao && s.ativo && s.id !== servico.id,
    )
    return padraoAtual ?? null
  }

  async function confirmarTroca() {
    if (!pendente) return
    const { values } = pendente
    setPendente(null)
    await persistir(values)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Editar serviço"
        description={servico?.nome ?? undefined}
        actions={
          <Button asChild variant="outline">
            <Link to={`/servicos/${numericId}`}>
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
        ) : isError || !servico ? (
          <p className="text-sm text-destructive">Serviço não encontrado.</p>
        ) : (
          <ServicoForm
            submitLabel="Salvar alterações"
            precoReadonly={!podeAtualizarPreco}
            defaultValues={{
              nome: servico.nome ?? '',
              descricao: servico.descricao ?? '',
              preco: servico.preco ?? 0,
              ehMaoDeObraPadrao: servico.ehMaoDeObraPadrao ?? false,
            }}
            onCancel={() => navigate(`/servicos/${numericId}`)}
            onSubmit={async (values) => {
              const conflito = detectarConflito(values)
              if (conflito) {
                setPendente({ values, padraoAtual: conflito })
                return
              }
              await persistir(values)
            }}
          />
        )}
      </div>

      {!podeAtualizarPreco && (
        <p className="text-xs text-muted-foreground">
          Para alterar o preço, use o botão <strong>Alterar preço</strong> na tela de detalhe —
          ação restrita a Admin.
        </p>
      )}

      <AlertDialog open={!!pendente} onOpenChange={(o) => !o && setPendente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar a mão de obra padrão?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Já existe um serviço marcado como <strong>mão de obra padrão</strong>:{' '}
                  <span className="font-medium">{pendente?.padraoAtual.nome}</span>.
                </p>
                <p>Apenas um serviço pode ser padrão por vez. Ao confirmar:</p>
                <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">
                      {pendente?.padraoAtual.nome}
                    </span>{' '}
                    deixa de ser o serviço padrão.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">{pendente?.values.nome}</span>{' '}
                    passa a ser o novo serviço padrão.
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={atualizar.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={atualizar.isPending}
              onClick={(e) => {
                e.preventDefault()
                void confirmarTroca()
              }}
            >
              Confirmar troca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
