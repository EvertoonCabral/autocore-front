import { useEffect } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useReescanearQr } from '../hooks/useReescanearQr'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReescanearQrDialog({ open, onOpenChange }: Props) {
  const reescanear = useReescanearQr()

  // Dispara o POST automaticamente ao abrir. Reset quando fecha.
  useEffect(() => {
    if (open) {
      reescanear.mutate()
    } else {
      reescanear.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isLoading = reescanear.isPending
  const data = reescanear.data
  const qrBase64 = data?.qrCodeBase64 ?? null
  const erroBack = data?.erroMensagem ?? null
  const erroRede = reescanear.isError ? (reescanear.error?.message ?? 'Falha ao gerar QR.') : null
  const erro = erroBack ?? erroRede

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reescanear QR code</DialogTitle>
          <DialogDescription>
            Escaneie com o WhatsApp do número que será o remetente das cobranças.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-4">
          {isLoading ? (
            <>
              <Skeleton className="h-64 w-64" />
              <p className="text-sm text-muted-foreground">Gerando QR code…</p>
            </>
          ) : qrBase64 ? (
            <>
              <img
                src={`data:image/png;base64,${qrBase64}`}
                alt="QR code da Evolution"
                width={256}
                height={256}
                className="rounded-md border"
              />
              <p className="text-center text-sm text-muted-foreground">
                Escaneie com o WhatsApp do número que será o remetente das cobranças.
              </p>
            </>
          ) : erro ? (
            <>
              <p
                role="alert"
                className="w-full rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {erro}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => reescanear.mutate()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Tentar novamente
              </Button>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
