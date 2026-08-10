import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/shared/components/EmptyState'
import { AuditoriaInfo } from '@/shared/components/AuditoriaInfo'
import { useObterConfiguracaoPagamento } from '../hooks/useObterConfiguracaoPagamento'
import { useAtualizarConfiguracaoPagamento } from '../hooks/useAtualizarConfiguracaoPagamento'
import { ConfiguracaoPagamentoForm } from './ConfiguracaoPagamentoForm'
import { StatusPagamentoCard } from './StatusPagamentoCard'

export function ConfiguracaoPagamentoTab() {
  const { data, isLoading, isError } = useObterConfiguracaoPagamento()
  const atualizar = useAtualizarConfiguracaoPagamento()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full max-w-3xl" />
        <Skeleton className="h-96 w-full max-w-3xl" />
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
      <StatusPagamentoCard />
      <div className="border-t" />
      <ConfiguracaoPagamentoForm
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
