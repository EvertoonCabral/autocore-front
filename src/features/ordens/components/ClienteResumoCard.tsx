import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusOrdemBadge } from '@/shared/components/StatusOrdemBadge'
import { formatBRL } from '@/lib/format'
import { useResumoCliente } from '@/features/clientes/hooks/useResumoCliente'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'

interface Props {
  clienteId: number | undefined
}

/**
 * Painel de contexto da Nova OS: saldo em aberto do cliente (em vermelho quando
 * > 0), nº de OS abertas e as últimas OS. Segue a linguagem visual do CaixaCard.
 * Só busca quando há `clienteId` (o hook fica `enabled: false` sem id).
 */
export function ClienteResumoCard({ clienteId }: Props) {
  const { data: resumo, isLoading } = useResumoCliente(clienteId)

  if (!clienteId) {
    return (
      <div className="rounded-md border border-border-faint bg-subtle p-4 text-sm text-muted-foreground">
        Selecione um cliente para ver o saldo em aberto e as últimas OS.
      </div>
    )
  }

  if (isLoading || !resumo) {
    return (
      <div className="space-y-3 rounded-md border border-border-faint bg-card p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    )
  }

  const saldo = resumo.saldoEmAberto ?? 0
  const ultimas = resumo.ultimas ?? []

  return (
    <div className="space-y-3 rounded-md border border-border-faint bg-card p-4" role="group" aria-label="Resumo do cliente">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Saldo em aberto
        </p>
        <p
          className={`text-2xl font-semibold leading-none tabular-nums ${saldo > 0 ? 'text-danger' : 'text-success'}`}
        >
          {formatBRL(saldo)}
        </p>
        <p className="text-xs text-muted-foreground">
          {resumo.osAbertas ?? 0} OS aberta(s) · {resumo.osConcluidasNaoPagas ?? 0} concluída(s) não paga(s)
        </p>
      </div>

      {ultimas.length > 0 && (
        <>
          <hr className="border-border-faint" />
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Últimas OS
            </p>
            <ul className="space-y-1.5">
              {ultimas.map((os) => (
                <li key={os.id ?? os.numero} className="flex items-center justify-between gap-2 text-sm">
                  <Link
                    to={`/ordens/${os.id}`}
                    className="font-medium tabular-nums hover:underline"
                  >
                    {os.numero}
                  </Link>
                  <div className="flex items-center gap-2">
                    <StatusOrdemBadge status={os.status as StatusOrdem | undefined} />
                    <span className="tabular-nums text-muted-foreground">
                      {formatBRL(os.saldoDevedor ?? 0)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
