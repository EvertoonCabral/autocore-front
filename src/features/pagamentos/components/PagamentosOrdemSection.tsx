import { CobrarNaBancadaDialog } from '@/features/cobranca-online/components/CobrarNaBancadaDialog'
import { IntencoesPagamentoTable } from '@/features/cobranca-online/components/IntencoesPagamentoTable'
import { useListarPagamentosDaOrdem } from '../hooks/useListarPagamentosDaOrdem'
import { PagamentosTable } from './PagamentosTable'
import { RegistrarPagamentoDialog } from './RegistrarPagamentoDialog'

interface Props {
  ordemId: number
  numero: string
  saldoDevedor: number
  /** True quando status da OS é Concluida (regra do back para permitir pagamento). */
  podeRegistrar: boolean
  /** CPF/CNPJ do cliente — exigido pelo Mercado Pago para cobrança online. */
  clienteCpfCnpj?: string | null | undefined
}

/**
 * Seção plugável na OrdemDetalhePage substituindo o placeholder da Fase 3.
 * Lista pagamentos + registrar manual + cobrança Pix na bancada (QR).
 */
export function PagamentosOrdemSection({
  ordemId,
  numero,
  saldoDevedor,
  podeRegistrar,
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
            podeRegistrar={podeRegistrar}
            clienteTemDocumento={clienteTemDocumento}
          />
          <RegistrarPagamentoDialog
            ordemId={ordemId}
            numero={numero}
            saldoDevedor={saldoDevedor}
            podeRegistrar={podeRegistrar}
          />
        </div>
      </div>
      {!podeRegistrar && (
        <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          Pagamentos só podem ser registrados em OSs com status <strong>Concluída</strong>. A
          cobrança antecipada (adiantamento) chega em breve.
        </p>
      )}
      <PagamentosTable ordemId={ordemId} pagamentos={pagamentos} loading={isLoading} />
      <IntencoesPagamentoTable ordemId={ordemId} />
    </section>
  )
}
