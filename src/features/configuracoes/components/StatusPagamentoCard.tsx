import { Loader2, PlugZap } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDataHora } from '@/lib/format'
import { useStatusPagamento } from '../hooks/useStatusPagamento'

interface BadgeInfo {
  label: string
  variant: 'default' | 'secondary' | 'destructive'
}

function badgeFor(valido: boolean | undefined, modo: string | null | undefined): BadgeInfo {
  if (modo === 'stub') return { label: 'Modo stub', variant: 'secondary' }
  if (valido === true) return { label: 'Credenciais OK', variant: 'default' }
  if (valido === false) return { label: 'Credenciais inválidas', variant: 'destructive' }
  return { label: 'Não testado', variant: 'secondary' }
}

export function StatusPagamentoCard() {
  const { data, isFetching, refetch } = useStatusPagamento()

  async function testar() {
    try {
      const result = await refetch()
      const status = result.data
      if (status?.modo === 'stub') {
        toast.message('Modo stub ativo — Mercado Pago não consultado.')
      } else if (status?.valido === true) {
        toast.success('Credenciais válidas.')
      } else {
        toast.error(status?.erroMensagem ?? 'Credenciais inválidas.')
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível testar as credenciais.')
    }
  }

  const info = badgeFor(data?.valido, data?.modo)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlugZap className="h-4 w-4" aria-hidden />
          Credenciais do Mercado Pago
        </CardTitle>
        <Button type="button" variant="secondary" size="sm" onClick={testar} disabled={isFetching}>
          {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
          Testar credenciais
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!data ? (
          <p className="text-sm text-muted-foreground">
            Clique em <strong>Testar credenciais</strong> para validar o access token junto ao
            Mercado Pago.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={info.variant} className="px-3 py-1 text-sm">
                {info.label}
              </Badge>
              {data.apelido && (
                <span className="text-sm font-medium">Conta: {data.apelido}</span>
              )}
              {data.modo && data.modo !== 'stub' && (
                <span className="text-xs text-muted-foreground">
                  Ambiente:{' '}
                  <code className="rounded bg-muted px-1">{data.modo}</code>
                </span>
              )}
            </div>

            {data.erroMensagem && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive"
              >
                {data.erroMensagem}
              </p>
            )}

            {data.consultadoEm && (
              <p className="text-xs text-muted-foreground">
                Consultado em{' '}
                <span className="tabular-nums">{formatDataHora(data.consultadoEm)}</span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
