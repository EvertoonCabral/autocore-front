import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL, diasDesde } from '@/lib/format'
import type { OrdemPendenteDto } from '@/api/types'
import { useCobrarOrdem } from '@/features/cobrancas/hooks/useCobrarOrdem'

interface Props {
  itens: readonly OrdemPendenteDto[]
  loading?: boolean
}

/** "há {n} dias" (ou "há 1 dia"); `null` → "recentemente". */
function contextoVencimento(iso: string | null | undefined): string {
  const dias = diasDesde(iso)
  if (dias == null) return 'venceu recentemente'
  if (dias <= 0) return 'vence hoje'
  return dias === 1 ? 'venceu há 1 dia' : `venceu há ${dias} dias`
}

function LinhaCobrar({ item }: { item: OrdemPendenteDto }) {
  const cobrar = useCobrarOrdem()

  async function disparar() {
    try {
      const r = await cobrar.mutateAsync(item.ordemServicoId ?? 0)
      switch (r.status) {
        case 'Enviada':
          toast.success(`Cobrança enviada para ${item.clienteNome ?? 'cliente'}.`)
          break
        case 'JaEnviadaHoje':
          toast.info(r.mensagem ?? 'Já enviado hoje (idempotência diária).')
          break
        case 'Falha':
          toast.error(r.erroEnvio ? `Falha no envio: ${r.erroEnvio}` : (r.mensagem ?? 'Falha no envio.'))
          break
        case 'OsInvalida':
          toast.error(r.mensagem ?? 'OS não pode receber cobrança.')
          break
        default:
          toast.message(r.mensagem ?? 'Operação concluída.')
      }
    } catch (err) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível disparar a cobrança.')
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={cobrar.isPending}
      aria-label={`Cobrar ${item.numero ?? ''} via WhatsApp`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void disparar()
      }}
    >
      Cobrar
    </Button>
  )
}

/**
 * "Precisa de você hoje" (design 1a) — top-5 cobranças vencidas.
 * Cada linha navega para o detalhe da OS; o botão "Cobrar" dispara a
 * cobrança individual sem sair do painel.
 */
export function PrecisaAtencaoCard({ itens, loading = false }: Props) {
  const navigate = useNavigate()

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex items-baseline gap-2">
          <CardTitle className="text-base">Precisa de você hoje</CardTitle>
          {!loading && itens.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>
        <Link to="/pendencias" className="text-sm font-medium text-primary hover:underline">
          Ver todas
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : itens.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nada vencido — tudo em dia.
          </p>
        ) : (
          itens.map((item) => (
            <div
              key={item.ordemServicoId}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/ordens/${item.ordemServicoId}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/ordens/${item.ordemServicoId}`)
                }
              }}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border-faint bg-background p-3 transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="h-10 w-1 shrink-0 rounded-full bg-danger" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{item.numero}</span>
                  <span className="truncate font-semibold">{item.clienteNome}</span>
                  <span className="rounded-pill bg-danger-soft px-1.5 py-0.5 text-[11px] font-medium text-danger">
                    vencida
                  </span>
                </div>
                <div className="mt-0.5 text-[13px] text-muted-foreground">
                  {contextoVencimento(item.dataVencimentoPagamento)}
                </div>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-danger">
                {formatBRL(item.saldoDevedor)}
              </span>
              <LinhaCobrar item={item} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
