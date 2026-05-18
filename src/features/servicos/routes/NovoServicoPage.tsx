import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import type { CatalogoServicoDto } from '@/api/types'
import { ServicoForm } from '../components/ServicoForm'
import type { ServicoFormValues } from '../helpers/servicoSchema'
import { useListarServicos } from '../hooks/useListarServicos'
import { useCriarServico } from '../hooks/useCriarServico'

export function NovoServicoPage() {
  const navigate = useNavigate()
  const criar = useCriarServico()
  const { data: lista } = useListarServicos(false)
  const [pendente, setPendente] = useState<{
    values: ServicoFormValues
    padraoAtual: CatalogoServicoDto
  } | null>(null)

  async function persistir(values: ServicoFormValues) {
    try {
      const { id } = await criar.mutateAsync(values)
      toast.success('Serviço cadastrado.')
      navigate(`/servicos/${id}`, { replace: true })
    } catch (err) {
      const apiErr = err as { kind?: string; message?: string }
      if (apiErr.kind !== 'validation') {
        toast.error(apiErr.message ?? 'Não foi possível cadastrar.')
      }
      throw err
    }
  }

  function detectarConflito(values: ServicoFormValues): CatalogoServicoDto | null {
    if (!values.ehMaoDeObraPadrao) return null
    const padraoAtual = (lista ?? []).find((s) => s.ehMaoDeObraPadrao && s.ativo)
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
        title="Novo serviço"
        description="Cadastre uma mão de obra ou diagnóstico."
        actions={
          <Button asChild variant="outline">
            <Link to="/servicos">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl rounded-md border bg-card p-6">
        <ServicoForm
          submitLabel="Cadastrar"
          onCancel={() => navigate('/servicos')}
          onSubmit={async (values) => {
            const conflito = detectarConflito(values)
            if (conflito) {
              setPendente({ values, padraoAtual: conflito })
              return
            }
            await persistir(values)
          }}
        />
      </div>

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
            <AlertDialogCancel disabled={criar.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={criar.isPending}
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
