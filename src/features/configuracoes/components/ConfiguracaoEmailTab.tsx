import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/shared/components/EmptyState'
import { AuditoriaInfo } from '@/shared/components/AuditoriaInfo'
import { useObterConfiguracaoEmail } from '../hooks/useObterConfiguracaoEmail'
import { useAtualizarConfiguracaoEmail } from '../hooks/useAtualizarConfiguracaoEmail'
import { ConfiguracaoEmailForm } from './ConfiguracaoEmailForm'

export function ConfiguracaoEmailTab() {
  const { data, isLoading, isError } = useObterConfiguracaoEmail()
  const atualizar = useAtualizarConfiguracaoEmail()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-72 w-full max-w-3xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Não foi possível carregar a configuração de email"
        description="Tente recarregar a página. Se o problema persistir, verifique se o backend está acessível."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl rounded-md border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Fallback do WhatsApp</p>
        <p className="text-muted-foreground">
          O AutoCore tenta entregar cobranças primeiro via WhatsApp (Evolution).
          Quando o envio falha ou o cliente não tem WhatsApp, e o fallback abaixo
          está habilitado, o sistema envia um e-mail com o mesmo template para o
          endereço cadastrado no cliente.
        </p>
      </div>

      <ConfiguracaoEmailForm
        defaultValues={data}
        onSubmit={(body) => atualizar.mutateAsync(body)}
      />

      {data.atualizadoEm && (
        <AuditoriaInfo
          atualizadoEm={data.atualizadoEm}
          atualizadoPorUsuarioNome={data.atualizadoPorUsuarioNome ?? undefined}
        />
      )}
    </div>
  )
}
