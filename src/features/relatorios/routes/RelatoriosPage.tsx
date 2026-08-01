import { Navigate, Link } from 'react-router-dom'
import { BarChart3, Wallet, Users, type LucideIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/shared/components/PageHeader'
import { useCan } from '@/shared/components/Can'

interface RelatorioLink {
  to: string
  title: string
  description: string
  icon: LucideIcon
}

const RELATORIOS: RelatorioLink[] = [
  {
    to: '/relatorios/faturamento',
    title: 'Faturamento recebido',
    description: 'Total recebido no período, série diária e distribuição por forma de pagamento.',
    icon: BarChart3,
  },
  {
    to: '/relatorios/financeiro',
    title: 'Resumo financeiro',
    description: 'Recebido, faturado e a receber, com o aging das pendências em aberto.',
    icon: Wallet,
  },
  {
    to: '/relatorios/clientes',
    title: 'Ranking de clientes',
    description: 'Clientes que mais faturaram no período, com ticket médio e total de OSs.',
    icon: Users,
  },
]

export function RelatoriosPage() {
  const podeVer = useCan('relatorios.ver')
  if (!podeVer) return <Navigate to="/" replace />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Relatórios"
        description="Indicadores financeiros e de clientes para acompanhamento do negócio."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RELATORIOS.map((r) => (
          <Link
            key={r.to}
            to={r.to}
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    <r.icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{r.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
