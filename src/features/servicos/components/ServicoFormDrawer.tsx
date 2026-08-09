import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
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
import { FormDrawerShell } from '@/shared/components/FormDrawerShell'
import { useCan } from '@/shared/components/Can'
import type { CatalogoServicoDto } from '@/api/types'
import { ServicoForm } from './ServicoForm'
import type { ServicoFormValues } from '../helpers/servicoSchema'
import { useCriarServico } from '../hooks/useCriarServico'
import { useAtualizarServico } from '../hooks/useAtualizarServico'
import { useObterServico } from '../hooks/useObterServico'
import { useListarServicos } from '../hooks/useListarServicos'

interface Props {
  mode: 'criar' | 'editar'
}

/**
 * Drawer (Sheet) de cadastro/edição de serviço sobre a lista. Preserva as
 * regras específicas do módulo: confirmação de troca da mão de obra padrão e
 * campo de preço restrito a quem tem `servicos.atualizarPreco`.
 */
export function ServicoFormDrawer({ mode }: Props) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const [dirty, setDirty] = useState(false)
  const podeAtualizarPreco = useCan('servicos.atualizarPreco')

  const criar = useCriarServico()
  const atualizar = useAtualizarServico()
  const { data: servico, isLoading, isError } = useObterServico(
    mode === 'editar' ? numericId : undefined,
  )
  const { data: lista } = useListarServicos(false)

  const [pendente, setPendente] = useState<{
    values: ServicoFormValues
    padraoAtual: CatalogoServicoDto
  } | null>(null)

  const fechar = () => navigate('/servicos')

  // Identidade estável dos valores iniciais (só muda quando o serviço carregado
  // muda). Evita que o `reset(defaultValues)` do form dispare a cada render do
  // drawer (que re-renderiza ao digitar, via onDirtyChange) e reverta o valor
  // digitado em modo edição.
  const defaultValues = useMemo(
    () =>
      servico
        ? {
            nome: servico.nome ?? '',
            descricao: servico.descricao ?? '',
            preco: servico.preco ?? 0,
            ehMaoDeObraPadrao: servico.ehMaoDeObraPadrao ?? false,
            garantiaDias: servico.garantiaDias ?? null,
            tempoEstimadoMinutos: servico.tempoEstimadoMinutos ?? null,
            categoria: servico.categoria ?? '',
          }
        : undefined,
    [servico],
  )

  async function persistir(values: ServicoFormValues) {
    try {
      if (mode === 'criar') {
        await criar.mutateAsync(values)
        toast.success('Serviço cadastrado.')
      } else {
        if (!servico || servico.id == null) return
        // Operador não pode alterar preço: mantém o atual.
        const precoFinal = podeAtualizarPreco ? values.preco : (servico.preco ?? 0)
        await atualizar.mutateAsync({ id: servico.id, values: { ...values, preco: precoFinal } })
        toast.success('Serviço atualizado.')
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
  }

  function detectarConflito(values: ServicoFormValues): CatalogoServicoDto | null {
    if (!values.ehMaoDeObraPadrao) return null
    const padraoAtual = (lista ?? []).find(
      (s) => s.ehMaoDeObraPadrao && s.ativo && (mode === 'criar' || s.id !== servico?.id),
    )
    return padraoAtual ?? null
  }

  async function confirmarTroca() {
    if (!pendente) return
    const { values } = pendente
    setPendente(null)
    await persistir(values)
  }

  const carregandoEdicao = mode === 'editar' && isLoading
  const erroEdicao = mode === 'editar' && (isError || !servico)

  return (
    <FormDrawerShell
      title={mode === 'criar' ? 'Novo serviço' : 'Editar serviço'}
      description={mode === 'criar' ? 'Cadastre uma mão de obra ou diagnóstico.' : (servico?.nome ?? undefined)}
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
        <p className="text-sm text-destructive">Serviço não encontrado.</p>
      ) : (
        <>
          <ServicoForm
            submitLabel={mode === 'criar' ? 'Cadastrar' : 'Salvar alterações'}
            precoReadonly={mode === 'editar' && !podeAtualizarPreco}
            onCancel={fechar}
            onDirtyChange={setDirty}
            {...(mode === 'editar' && defaultValues ? { defaultValues } : {})}
            onSubmit={async (values) => {
              const conflito = detectarConflito(values)
              if (conflito) {
                setPendente({ values, padraoAtual: conflito })
                return
              }
              await persistir(values)
            }}
          />

          {mode === 'editar' && !podeAtualizarPreco && (
            <p className="mt-4 text-xs text-muted-foreground">
              Para alterar o preço, use o botão <strong>Alterar preço</strong> na tela de detalhe —
              ação restrita a Admin.
            </p>
          )}
        </>
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
                    <span className="font-medium text-foreground">{pendente?.padraoAtual.nome}</span>{' '}
                    deixa de ser o serviço padrão.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">{pendente?.values.nome}</span> passa
                    a ser o novo serviço padrão.
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={criar.isPending || atualizar.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={criar.isPending || atualizar.isPending}
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
    </FormDrawerShell>
  )
}
