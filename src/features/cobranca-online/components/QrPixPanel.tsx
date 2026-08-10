import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, Clock, Copy, Loader2, XCircle } from 'lucide-react'
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
import { formatarTempoRestante, estaExpirado } from '../helpers/contagemRegressiva'

interface Props {
  intencao: IntencaoPagamentoDto
  onGerarNovo: () => void
  gerandoNovo: boolean
}

/**
 * Painel do QR Pix da bancada: QR grande, copia-e-cola, contagem regressiva e
 * badge de status ao vivo. O componente pai faz o polling (`useObterIntencao`);
 * aqui só refletimos o estado e o tempo restante.
 */
export function QrPixPanel({ intencao, onGerarNovo, gerandoNovo }: Props) {
  const [agora, setAgora] = useState(() => Date.now())

  const status = intencao.status ?? StatusIntencaoValues.Pendente
  const pendente = status === StatusIntencaoValues.Pendente
  const aprovado = status === StatusIntencaoValues.Aprovada

  // Tick de 1s só enquanto pendente (para o timer).
  useEffect(() => {
    if (!pendente) return
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [pendente])

  const tempoRestante = formatarTempoRestante(intencao.expiraEm, agora)
  const expirouLocal = pendente && estaExpirado(intencao.expiraEm, agora)

  async function copiar() {
    if (!intencao.pixCopiaECola) return
    try {
      await navigator.clipboard.writeText(intencao.pixCopiaECola)
      toast.success('Código Pix copiado.')
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

  if (status === StatusIntencaoValues.Recusada) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <XCircle className="h-12 w-12 text-destructive" aria-hidden />
        <p className="font-medium">Pagamento recusado</p>
        {intencao.motivoRecusa && (
          <p className="text-sm text-muted-foreground">{intencao.motivoRecusa}</p>
        )}
        <Button type="button" onClick={onGerarNovo} disabled={gerandoNovo}>
          {gerandoNovo && <Loader2 className="h-4 w-4 animate-spin" />}
          Gerar novo QR
        </Button>
      </div>
    )
  }

  // Expirado (local ou confirmado pelo back) → oferece regenerar.
  if (status === StatusIntencaoValues.Expirada || expirouLocal) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Clock className="h-12 w-12 text-muted-foreground" aria-hidden />
        <p className="font-medium">QR Pix expirado</p>
        <p className="text-sm text-muted-foreground">Gere um novo código para continuar.</p>
        <Button type="button" onClick={onGerarNovo} disabled={gerandoNovo}>
          {gerandoNovo && <Loader2 className="h-4 w-4 animate-spin" />}
          Gerar novo QR
        </Button>
      </div>
    )
  }

  // Pendente com QR válido.
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <Badge variant={statusIntencaoVariant(status)}>{statusIntencaoLabel(status)}</Badge>
        {tempoRestante && (
          <span className="flex items-center gap-1 text-sm tabular-nums text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            expira em {tempoRestante}
          </span>
        )}
      </div>

      {intencao.pixCopiaECola ? (
        <div className="rounded-lg bg-white p-4">
          <QRCodeSVG value={intencao.pixCopiaECola} size={220} level="M" />
        </div>
      ) : (
        <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg border">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="w-full space-y-2">
        <p className="text-center text-sm text-muted-foreground">
          Escaneie com o app do banco ou copie o código:
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={intencao.pixCopiaECola ?? ''}
            className="w-full truncate rounded-md border bg-muted px-3 py-2 font-mono text-xs"
            aria-label="Código Pix copia e cola"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={copiar}
            disabled={!intencao.pixCopiaECola}
            aria-label="Copiar código Pix"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        Aguardando confirmação do pagamento…
      </p>
    </div>
  )
}
