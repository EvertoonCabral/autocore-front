import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { formatBRL } from '@/lib/format'
import { StatusIntencaoValues } from '@/shared/enums/statusIntencaoPagamento'
import { TipoIntencaoValues } from '@/shared/enums/tipoIntencaoPagamento'
import { useSimularCobranca } from '../hooks/useSimularCobranca'
import { useCriarPixOrdem } from '../hooks/useCriarPixOrdem'
import { useCriarLinkOrdem } from '../hooks/useCriarLinkOrdem'
import { useObterIntencao } from '../hooks/useObterIntencao'
import { ResumoValorCobrado } from './ResumoValorCobrado'
import { QrPixPanel } from './QrPixPanel'
import { LinkPagamentoPanel } from './LinkPagamentoPanel'

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
  /** Cliente tem CPF/CNPJ — exigido pelo Mercado Pago. */
  clienteTemDocumento: boolean
}

/**
 * Cobrança online da OS: aba Pix (QR pago na hora) ou Link (Checkout Pro, com
 * crédito/débito/Pix/boleto). Em OS não concluída, exige confirmação explícita
 * de adiantamento (a regra "pagamento só na OS concluída" é preservada).
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
  const [tipo, setTipo] = useState<1 | 2>(TipoIntencaoValues.PixQr)
  const [valorStr, setValorStr] = useState(maximo.toFixed(2))
  const [intencaoId, setIntencaoId] = useState<number | null>(null)
  const [aprovadoNotificado, setAprovadoNotificado] = useState(false)
  const [adiantamentoConfirmado, setAdiantamentoConfirmado] = useState(false)

  const queryClient = useQueryClient()
  const criarPix = useCriarPixOrdem()
  const criarLink = useCriarLinkOrdem()
  const criando = criarPix.isPending || criarLink.isPending

  const valorNum = Number(valorStr.replace(',', '.'))
  const valorValido = Number.isFinite(valorNum) && valorNum > 0 && valorNum <= maximo + 0.001
  const liberado = concluida || adiantamentoConfirmado

  const simulacao = useSimularCobranca(
    ordemId,
    valorValido ? valorNum : undefined,
    tipo,
    open && intencaoId == null && liberado,
  )

  const intencaoQuery = useObterIntencao(intencaoId)
  const intencao = intencaoQuery.data

  useEffect(() => {
    if (intencao?.status === StatusIntencaoValues.Aprovada && !aprovadoNotificado) {
      setAprovadoNotificado(true)
      toast.success(concluida ? 'Pagamento aprovado — registrado na OS.' : 'Adiantamento aprovado.')
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

  async function gerar() {
    try {
      const vars = { ordemServicoId: ordemId, valor: valorNum, adiantar: !concluida }
      const nova =
        tipo === TipoIntencaoValues.PixQr
          ? await criarPix.mutateAsync({ ...vars, origem: 1 })
          : await criarLink.mutateAsync(vars)
      if (nova.id != null) {
        setIntencaoId(nova.id)
        setAprovadoNotificado(false)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível gerar a cobrança.'
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
          Cobrar online
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {concluida ? 'Cobrança online' : 'Adiantamento'} — {numero}
          </DialogTitle>
          <DialogDescription>
            {intencaoId == null
              ? 'Escolha o meio, defina o valor e gere a cobrança.'
              : 'Aguardando o pagamento. Some quando o pagamento é confirmado.'}
          </DialogDescription>
        </DialogHeader>

        {!clienteTemDocumento ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            Cadastre o <strong>CPF/CNPJ do cliente</strong> para cobrar online (exigência do
            Mercado Pago).
          </p>
        ) : intencaoId == null ? (
          <div className="space-y-4">
            <Tabs value={String(tipo)} onValueChange={(v) => setTipo(Number(v) as 1 | 2)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="1">Pix (QR)</TabsTrigger>
                <TabsTrigger value="2">Link de pagamento</TabsTrigger>
              </TabsList>
            </Tabs>

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
              <Label htmlFor="valor-cobranca">Valor (R$)</Label>
              <Input
                id="valor-cobranca"
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
                onClick={gerar}
                disabled={!valorValido || !liberado || criando || simulacao.isLoading}
              >
                {criando ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                {tipo === TipoIntencaoValues.PixQr ? 'Gerar QR Pix' : 'Gerar link'}
              </Button>
            </DialogFooter>
          </div>
        ) : intencao ? (
          intencao.tipo === TipoIntencaoValues.LinkCheckout ? (
            <LinkPagamentoPanel intencao={intencao} onGerarNovo={resetar} gerandoNovo={criando} />
          ) : (
            <QrPixPanel intencao={intencao} onGerarNovo={resetar} gerandoNovo={criando} />
          )
        ) : (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
