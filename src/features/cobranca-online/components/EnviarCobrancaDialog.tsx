import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TipoIntencaoValues } from '@/shared/enums/tipoIntencaoPagamento'
import { useEnviarCobrancaComDocumento } from '../hooks/useEnviarCobrancaComDocumento'

interface Props {
  ordemId: number
  numero: string
  clienteTemDocumento: boolean
  cancelada?: boolean
}

/**
 * Envia a cobrança da OS com o PDF anexado (WhatsApp → e-mail de fallback) e o
 * link/QR de pagamento. O atendente escolhe o meio (Pix ou link de checkout).
 */
export function EnviarCobrancaDialog({ ordemId, numero, clienteTemDocumento, cancelada }: Props) {
  const [open, setOpen] = useState(false)
  const [meio, setMeio] = useState<1 | 2>(TipoIntencaoValues.PixQr)
  const enviar = useEnviarCobrancaComDocumento()

  async function submit() {
    try {
      const r = await enviar.mutateAsync({ ordemServicoId: ordemId, meio })
      if (r.status === 'Enviada') {
        toast.success(r.mensagem ?? 'Cobrança enviada.')
        setOpen(false)
      } else {
        toast.error(r.erroEnvio ?? r.mensagem ?? 'Não foi possível enviar a cobrança.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível enviar a cobrança.'
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={cancelada || !clienteTemDocumento}>
          <Send className="h-4 w-4" />
          Enviar cobrança
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar cobrança — {numero}</DialogTitle>
          <DialogDescription>
            Envia o documento da OS por WhatsApp (com anexo) e, em falha, por e-mail. A mensagem
            leva o {meio === TipoIntencaoValues.PixQr ? 'Pix copia e cola' : 'link de pagamento'}.
          </DialogDescription>
        </DialogHeader>

        {!clienteTemDocumento ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            Cadastre o <strong>CPF/CNPJ do cliente</strong> para cobrar online.
          </p>
        ) : (
          <div className="space-y-4">
            <Tabs value={String(meio)} onValueChange={(v) => setMeio(Number(v) as 1 | 2)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="1">Pix (QR)</TabsTrigger>
                <TabsTrigger value="2">Link de pagamento</TabsTrigger>
              </TabsList>
            </Tabs>

            <p className="text-sm text-muted-foreground">
              Um QR/link será gerado e anexado ao PDF. Você acompanha a confirmação na lista de
              cobranças da OS.
            </p>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={enviar.isPending}>
                Cancelar
              </Button>
              <Button type="button" onClick={submit} disabled={enviar.isPending}>
                {enviar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
