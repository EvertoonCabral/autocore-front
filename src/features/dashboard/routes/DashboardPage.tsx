import { useAuth } from '@/features/auth/auth-context'

export function DashboardPage() {
  const { user } = useAuth()
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Bem-vindo, {user?.nomeCompleto}</h1>
      <p className="text-muted-foreground">
        As próximas fases adicionarão Clientes, Catálogo, Produtos, Ordens de Serviço,
        Pagamentos, Cobrança e Configurações.
      </p>
    </div>
  )
}
