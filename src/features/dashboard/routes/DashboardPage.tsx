import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import { Button } from '@/components/ui/button'
import { CaixaCard } from '../components/CaixaCard'
import { FaixaFluxo } from '../components/FaixaFluxo'
import { FaturamentoChart } from '../components/FaturamentoChart'
import { PrecisaAtencaoCard } from '../components/PrecisaAtencaoCard'
import { useDashboardResumo } from '../hooks/useDashboardResumo'

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useDashboardResumo()

  const hoje = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {hoje}
          </p>
          <h1 className="text-2xl font-semibold leading-tight">
            {`Bem-vindo${user?.nomeCompleto ? ', ' + user.nomeCompleto : ''}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild>
            <Link to="/clientes/novo">Novo cliente</Link>
          </Button>
          <Button asChild>
            <Link to="/ordens/nova">
              <Plus className="h-4 w-4" />
              Nova OS
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Faixa de fluxo */}
      <FaixaFluxo fluxo={data?.fluxo} loading={isLoading} />

      {/* 3. Precisa de você hoje + Caixa */}
      <div className="flex flex-col gap-5 xl:flex-row">
        <PrecisaAtencaoCard itens={data?.precisaAtencao ?? []} loading={isLoading} />
        <CaixaCard caixa={data?.caixa} loading={isLoading} />
      </div>

      {/* 4. Faturamento */}
      <FaturamentoChart />

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          Não foi possível carregar o painel. Tente recarregar a página.
        </p>
      ) : null}
    </div>
  )
}
