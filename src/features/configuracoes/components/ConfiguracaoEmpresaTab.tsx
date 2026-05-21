import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/shared/components/EmptyState'
import { AuditoriaInfo } from '@/shared/components/AuditoriaInfo'
import { useObterConfiguracaoEmpresa } from '../hooks/useObterConfiguracaoEmpresa'
import { SecaoLogo } from './SecaoLogo'
import { SecaoNomeEmpresa } from './SecaoNomeEmpresa'

export function ConfiguracaoEmpresaTab() {
  const { data, isLoading, isError } = useObterConfiguracaoEmpresa()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full max-w-3xl" />
        <Skeleton className="h-40 w-full max-w-3xl" />
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
      <SecaoLogo configuracao={data} />
      <SecaoNomeEmpresa configuracao={data} />
      {data.atualizadoEm && (
        <AuditoriaInfo
          atualizadoEm={data.atualizadoEm}
          atualizadoPorUsuarioNome={data.atualizadoPorUsuarioNome}
        />
      )}
    </div>
  )
}
