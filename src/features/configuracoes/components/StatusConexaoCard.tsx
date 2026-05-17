import { useState } from 'react'
import { Loader2, QrCode, RefreshCw, Wifi } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDataHora, formatTelefone } from '@/lib/format'
import { useStatusConexaoCobranca } from '../hooks/useStatusConexaoCobranca'
import { ReescanearQrDialog } from './ReescanearQrDialog'

interface BadgeInfo {
  label: string
  variant: 'default' | 'secondary' | 'destructive'
}

function badgeFor(
  conectado: boolean | undefined,
  estadoBruto: string | null | undefined,
): BadgeInfo {
  if (conectado === true) return { label: 'Conectado', variant: 'default' }
  if (estadoBruto === 'stub') return { label: 'Modo stub', variant: 'secondary' }
  return { label: 'Desconectado', variant: 'destructive' }
}

export function StatusConexaoCard() {
  const { data, isLoading, isError, isFetching, refetch } = useStatusConexaoCobranca()
  const [qrOpen, setQrOpen] = useState(false)

  async function testarConexao() {
    try {
      const result = await refetch()
      const status = result.data
      if (status?.conectado === true) {
        toast.success('Conexão OK.')
      } else if (status?.estadoBruto === 'stub') {
        toast.message('Modo stub ativo — Evolution não consultada.')
      } else {
        toast.error(status?.erroMensagem ?? 'Conexão falhou.')
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível consultar o status.')
    }
  }

  const info = badgeFor(data?.conectado, data?.estadoBruto)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wifi className="h-4 w-4" aria-hidden />
          Status da conexão
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar agora
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={testarConexao}
            disabled={isFetching}
          >
            Testar conexão
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQrOpen(true)}
          >
            <QrCode className="h-4 w-4" />
            Reescanear QR
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : isError || !data ? (
          <p className="text-sm text-destructive">
            Não foi possível consultar o status da Evolution.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={info.variant} className="px-3 py-1 text-sm">
                {info.label}
              </Badge>
              {data.numero && (
                <span className="text-sm font-medium">
                  {formatTelefone(data.numero)}
                </span>
              )}
            </div>

            {data.estadoBruto && (
              <p className="text-xs text-muted-foreground">
                Estado Evolution:{' '}
                <code className="rounded bg-muted px-1">{data.estadoBruto}</code>
              </p>
            )}

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

      <ReescanearQrDialog open={qrOpen} onOpenChange={setQrOpen} />
    </Card>
  )
}
