import { CobrarNaBancadaDialog } from '@/features/cobranca-online/components/CobrarNaBancadaDialog'
import { EnviarCobrancaDialog } from '@/features/cobranca-online/components/EnviarCobrancaDialog'
import { IntencoesPagamentoTable } from '@/features/cobranca-online/components/IntencoesPagamentoTable'
import { AdiantamentoAviso } from '@/features/cobranca-online/components/AdiantamentoAviso'
import { useListarPagamentosDaOrdem } from '../hooks/useListarPagamentosDaOrdem'
import { PagamentosTable } from './PagamentosTable'
import { RegistrarPagamentoDialog } from './RegistrarPagamentoDialog'

interface Props {
  ordemId: number
  numero: string
  saldoDevedor: number
  /** True quando status da OS é Concluida (regra do back para permitir pagamento). */
  podeRegistrar: boolean
  /** True quando a OS está Cancelada (cobrança bloqueada). */
  cancelada?: boolean
  /** Saldo ainda a cobrar (saldo devedor − adiantado). */
  saldoAPagar?: number
  totalAdiantado?: number
  totalExcedente?: number
  /** CPF/CNPJ do cliente — exigido pelo Mercado Pago para cobrança online. */
  clienteCpfCnpj?: string | null | undefined
}

/**
 * Seção plugável na OrdemDetalhePage: lista pagamentos + registrar manual +
 * cobrança Pix na bancada (QR), com suporte a adiantamento em OS não concluída.
 */
export function PagamentosOrdemSection({
  ordemId,
  numero,
  saldoDevedor,
  podeRegistrar,
  cancelada = false,
  saldoAPagar,
  totalAdiantado = 0,
  totalExcedente = 0,
  clienteCpfCnpj,
}: Props) {
  const { data: pagamentos, isLoading } = useListarPagamentosDaOrdem(ordemId)
  const clienteTemDocumento = !!clienteCpfCnpj && clienteCpfCnpj.trim().length > 0

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Pagamentos</h2>
        <div className="flex flex-wrap items-center gap-2">
          <CobrarNaBancadaDialog
            ordemId={ordemId}
            numero={numero}
            saldoDevedor={saldoDevedor}
            saldoAPagar={saldoAPagar ?? saldoDevedor}
            concluida={podeRegistrar}
            cancelada={cancelada}
            clienteTemDocumento={clienteTemDocumento}
          />
          <EnviarCobrancaDialog
            ordemId={ordemId}
            numero={numero}
            clienteTemDocumento={clienteTemDocumento}
            cancelada={cancelada}
          />
          <RegistrarPagamentoDialog
            ordemId={ordemId}
            numero={numero}
            saldoDevedor={saldoDevedor}
            podeRegistrar={podeRegistrar}
          />
        </div>
      </div>

      <AdiantamentoAviso totalAdiantado={totalAdiantado} totalExcedente={totalExcedente} />

      {!podeRegistrar && !cancelada && (
        <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          Pagamento manual só em OS <strong>Concluída</strong>. Para cobrar antes, use a cobrança
          Pix com <strong>adiantamento</strong> — ela vira pagamento no fechamento.
        </p>
      )}
      <PagamentosTable ordemId={ordemId} pagamentos={pagamentos} loading={isLoading} />
      <IntencoesPagamentoTable ordemId={ordemId} />
    </section>
  )
}
