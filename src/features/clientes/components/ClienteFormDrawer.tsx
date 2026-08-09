import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { FormDrawerShell } from '@/shared/components/FormDrawerShell'
import { ClienteForm } from './ClienteForm'
import { useCriarCliente } from '../hooks/useCriarCliente'
import { useAtualizarCliente } from '../hooks/useAtualizarCliente'
import { useObterCliente } from '../hooks/useObterCliente'

interface Props {
  mode: 'criar' | 'editar'
}

/**
 * Drawer (Sheet) de cadastro/edição de cliente sobre a lista. A URL continua
 * mudando (`/clientes/novo`, `/clientes/:id/editar`) — deep-linkável — mas o
 * form abre num drawer sobre a lista, que permanece montada atrás.
 */
export function ClienteFormDrawer({ mode }: Props) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const [dirty, setDirty] = useState(false)

  const criar = useCriarCliente()
  const atualizar = useAtualizarCliente()
  const { data: cliente, isLoading, isError } = useObterCliente(
    mode === 'editar' ? numericId : undefined,
  )

  const fechar = () => navigate('/clientes')

  // Identidade **estável** dos valores iniciais (só muda quando o cliente
  // carregado muda). O `ClienteForm` faz `reset(defaultValues)` num efeito
  // dependente da referência; se recriássemos o objeto a cada render (o drawer
  // re-renderiza ao digitar, via onDirtyChange), o reset dispararia a cada
  // tecla e reverteria o que o usuário digita em modo edição.
  const defaultValues = useMemo(
    () =>
      cliente
        ? {
            nome: cliente.nome ?? '',
            telefone: cliente.telefone ?? '',
            segundoTelefone: cliente.segundoTelefone ?? '',
            email: cliente.email ?? '',
            cpfCnpj: cliente.cpfCnpj ?? '',
            cep: cliente.cep ?? '',
            logradouro: cliente.logradouro ?? '',
            numero: cliente.numero ?? '',
            bairro: cliente.bairro ?? '',
            cidade: cliente.cidade ?? '',
            uf: cliente.uf ?? '',
            observacoes: cliente.observacoes ?? '',
          }
        : undefined,
    [cliente],
  )

  return (
    <FormDrawerShell
      title={mode === 'criar' ? 'Novo cliente' : 'Editar cliente'}
      description={mode === 'criar' ? 'Preencha os dados para cadastrar.' : (cliente?.nome ?? undefined)}
      dirty={dirty}
      onClose={fechar}
    >
      {mode === 'editar' && isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : mode === 'editar' && (isError || !cliente) ? (
        <p className="text-sm text-destructive">Cliente não encontrado.</p>
      ) : (
        <ClienteForm
          submitLabel={mode === 'criar' ? 'Cadastrar' : 'Salvar alterações'}
          onCancel={fechar}
          onDirtyChange={setDirty}
          {...(mode === 'editar' && defaultValues ? { defaultValues } : {})}
          onSubmit={async (values) => {
            try {
              if (mode === 'criar') {
                await criar.mutateAsync(values)
                toast.success('Cliente cadastrado com sucesso.')
              } else {
                await atualizar.mutateAsync({ id: numericId, values })
                toast.success('Cliente atualizado.')
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
      )}
    </FormDrawerShell>
  )
}
