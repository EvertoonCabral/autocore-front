import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/shared/components/EmptyState'
import { AuditoriaInfo } from '@/shared/components/AuditoriaInfo'
import { useObterConfiguracaoCobranca } from '../hooks/useObterConfiguracaoCobranca'
import { useAtualizarConfiguracaoCobranca } from '../hooks/useAtualizarConfiguracaoCobranca'
import { ConfiguracaoCobrancaForm } from './ConfiguracaoCobrancaForm'
import { StatusConexaoCard } from './StatusConexaoCard'

export function ConfiguracaoCobrancaTab() {
  const { data, isLoading, isError } = useObterConfiguracaoCobranca()
  const atualizar = useAtualizarConfiguracaoCobranca()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full max-w-3xl" />
        <Skeleton className="h-72 w-full max-w-3xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Não foi possível carregar a configuração"
        description="Tente recarregar a página. Se o problema persistir, verifique se o backend está acessível."
      />
    )
  }

  return (
    <div className="space-y-6">
      <StatusConexaoCard />
      <div className="border-t" />
      <ConfiguracaoCobrancaForm
        defaultValues={data}
        onSubmit={(body) => atualizar.mutateAsync(body)}
      />
      {data.atualizadoEm && (
        <AuditoriaInfo
          atualizadoEm={data.atualizadoEm}
          atualizadoPorUsuarioNome={data.atualizadoPorUsuarioNome}
        />
      )}
    </div>
  )
}
