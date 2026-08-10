import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, Copy, ExternalLink, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/format'
import {
  StatusIntencaoValues,
  statusIntencaoLabel,
  statusIntencaoVariant,
} from '@/shared/enums/statusIntencaoPagamento'
import type { IntencaoPagamentoDto } from '../hooks/useCobrancaOnlineKeys'

interface Props {
  intencao: IntencaoPagamentoDto
  onGerarNovo: () => void
  gerandoNovo: boolean
}

/**
 * Painel do link de Checkout Pro: link para abrir/copiar, QR do link (para o
 * cliente escanear na bancada) e badge de status ao vivo. O componente pai faz
 * o polling.
 */
export function LinkPagamentoPanel({ intencao, onGerarNovo, gerandoNovo }: Props) {
  const status = intencao.status ?? StatusIntencaoValues.Pendente
  const aprovado = status === StatusIntencaoValues.Aprovada
  const url = intencao.urlCheckout ?? ''

  async function copiar() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado.')
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  if (aprovado) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-success-foreground" aria-hidden />
        <div>
          <p className="text-lg font-semibold">Pagamento aprovado</p>
          <p className="text-sm text-muted-foreground">
            Registrado na OS ({formatBRL(intencao.valorBase)}).
          </p>
        </div>
      </div>
    )
  }

  if (status === StatusIntencaoValues.Recusada || status === StatusIntencaoValues.Cancelada) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <XCircle className="h-12 w-12 text-destructive" aria-hidden />
        <p className="font-medium">
          {status === StatusIntencaoValues.Recusada ? 'Pagamento recusado' : 'Cobrança cancelada'}
        </p>
        {intencao.motivoRecusa && (
          <p className="text-sm text-muted-foreground">{intencao.motivoRecusa}</p>
        )}
        <Button type="button" onClick={onGerarNovo} disabled={gerandoNovo}>
          {gerandoNovo && <Loader2 className="h-4 w-4 animate-spin" />}
          Gerar novo link
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Badge variant={statusIntencaoVariant(status)}>{statusIntencaoLabel(status)}</Badge>

      {url && (
        <div className="rounded-lg bg-white p-4">
          <QRCodeSVG value={url} size={200} level="M" />
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Envie o link ao cliente ou deixe-o escanear o QR. Aceita crédito, débito, Pix e boleto.
      </p>

      <div className="flex w-full gap-2">
        <input
          readOnly
          value={url}
          className="w-full truncate rounded-md border bg-muted px-3 py-2 font-mono text-xs"
          aria-label="Link de pagamento"
        />
        <Button type="button" variant="outline" size="icon" onClick={copiar} aria-label="Copiar link">
          <Copy className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" asChild aria-label="Abrir link">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        Aguardando confirmação do pagamento…
      </p>
    </div>
  )
}
