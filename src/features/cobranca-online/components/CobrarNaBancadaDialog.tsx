import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatBRL } from '@/lib/format'
import { StatusIntencaoValues } from '@/shared/enums/statusIntencaoPagamento'
import { useSimularCobranca } from '../hooks/useSimularCobranca'
import { useCriarPixOrdem } from '../hooks/useCriarPixOrdem'
import { useObterIntencao } from '../hooks/useObterIntencao'
import { ResumoValorCobrado } from './ResumoValorCobrado'
import { QrPixPanel } from './QrPixPanel'

interface Props {
  ordemId: number
  numero: string
  saldoDevedor: number
  /** Saldo ainda a cobrar (saldo devedor − adiantado). Base do adiantamento. */
  saldoAPagar: number
  /** OS concluída — quitação direta. Caso contrário, é adiantamento (opt-in). */
  concluida: boolean
  /** OS cancelada — cobrança bloqueada. */
  cancelada: boolean
  /** Cliente tem CPF/CNPJ — exigido pelo Mercado Pago no Pix. */
  clienteTemDocumento: boolean
}

/**
 * Fluxo de cobrança Pix na bancada. Em OS concluída, quita o saldo. Em OS não
 * concluída, exige confirmação explícita de adiantamento (a regra "pagamento só
 * na OS concluída" é preservada: o adiantamento vira pagamento no fechamento).
 */
export function CobrarNaBancadaDialog({
  ordemId,
  numero,
  saldoDevedor,
  saldoAPagar,
  concluida,
  cancelada,
  clienteTemDocumento,
}: Props) {
  const maximo = concluida ? saldoDevedor : saldoAPagar

  const [open, setOpen] = useState(false)
  const [valorStr, setValorStr] = useState(maximo.toFixed(2))
  const [intencaoId, setIntencaoId] = useState<number | null>(null)
  const [aprovadoNotificado, setAprovadoNotificado] = useState(false)
  const [adiantamentoConfirmado, setAdiantamentoConfirmado] = useState(false)

  const queryClient = useQueryClient()
  const criar = useCriarPixOrdem()

  const valorNum = Number(valorStr.replace(',', '.'))
  const valorValido = Number.isFinite(valorNum) && valorNum > 0 && valorNum <= maximo + 0.001

  // Em adiantamento, só simula/gera após o opt-in.
  const liberado = concluida || adiantamentoConfirmado

  const simulacao = useSimularCobranca(
    ordemId,
    valorValido ? valorNum : undefined,
    1,
    open && intencaoId == null && liberado,
  )

  const intencaoQuery = useObterIntencao(intencaoId)
  const intencao = intencaoQuery.data

  useEffect(() => {
    if (intencao?.status === StatusIntencaoValues.Aprovada && !aprovadoNotificado) {
      setAprovadoNotificado(true)
      toast.success(
        concluida ? 'Pagamento aprovado — registrado na OS.' : 'Adiantamento aprovado.',
      )
      void queryClient.invalidateQueries({ queryKey: ['pagamentos', 'ordem', ordemId] })
      void queryClient.invalidateQueries({ queryKey: ['ordens', 'detail', ordemId] })
      void queryClient.invalidateQueries({ queryKey: ['cobranca-online', 'ordem', ordemId] })
    }
  }, [intencao?.status, aprovadoNotificado, ordemId, queryClient, concluida])

  function resetar() {
    setIntencaoId(null)
    setAprovadoNotificado(false)
    setAdiantamentoConfirmado(false)
    setValorStr(maximo.toFixed(2))
  }

  async function gerarQr() {
    try {
      const nova = await criar.mutateAsync({
        ordemServicoId: ordemId,
        valor: valorNum,
        origem: 1,
        adiantar: !concluida,
      })
      if (nova.id != null) {
        setIntencaoId(nova.id)
        setAprovadoNotificado(false)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível gerar o QR.'
      toast.error(msg)
    }
  }

  const bloqueado = cancelada || maximo <= 0 || !clienteTemDocumento

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) resetar()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" disabled={bloqueado}>
          <QrCode className="h-4 w-4" />
          Cobrar na bancada (QR)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {concluida ? 'Cobrança Pix' : 'Adiantamento via Pix'} — {numero}
          </DialogTitle>
          <DialogDescription>
            {intencaoId == null
              ? 'Defina o valor e gere o QR Pix para o cliente pagar na hora.'
              : 'Aguardando o pagamento. O QR some quando o pagamento é confirmado.'}
          </DialogDescription>
        </DialogHeader>

        {!clienteTemDocumento ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            Cadastre o <strong>CPF/CNPJ do cliente</strong> para cobrar online (exigência do
            Mercado Pago).
          </p>
        ) : intencaoId == null ? (
          <div className="space-y-4">
            {!concluida && (
              <div className="flex items-start justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                <span className="text-amber-800 dark:text-amber-200">
                  Esta OS ainda não foi concluída. O valor entra como <strong>adiantamento</strong> e
                  será registrado como pagamento automaticamente ao concluir a OS.
                </span>
                <Switch
                  checked={adiantamentoConfirmado}
                  onCheckedChange={(v) => setAdiantamentoConfirmado(v === true)}
                  aria-label="Confirmar adiantamento"
                  className="mt-0.5"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="valor-pix">Valor (R$)</Label>
              <Input
                id="valor-pix"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={valorStr}
                onChange={(e) => setValorStr(e.target.value)}
                disabled={!liberado}
                aria-invalid={!valorValido}
              />
              {!valorValido && (
                <p role="alert" className="text-sm text-destructive">
                  Informe um valor entre R$ 0,01 e {formatBRL(maximo)}.
                </p>
              )}
            </div>

            {liberado && (
              <ResumoValorCobrado
                simulacao={simulacao.data}
                loading={simulacao.isLoading || simulacao.isFetching}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                onClick={gerarQr}
                disabled={!valorValido || !liberado || criar.isPending || simulacao.isLoading}
              >
                {criar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Gerar QR Pix
              </Button>
            </DialogFooter>
          </div>
        ) : intencao ? (
          <QrPixPanel intencao={intencao} onGerarNovo={resetar} gerandoNovo={criar.isPending} />
        ) : (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
