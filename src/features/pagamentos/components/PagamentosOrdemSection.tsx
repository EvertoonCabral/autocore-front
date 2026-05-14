import { useListarPagamentosDaOrdem } from '../hooks/useListarPagamentosDaOrdem'
import { PagamentosTable } from './PagamentosTable'
import { RegistrarPagamentoDialog } from './RegistrarPagamentoDialog'

interface Props {
  ordemId: number
  numero: string
  saldoDevedor: number
  /** True quando status da OS é Concluida (regra do back para permitir pagamento). */
  podeRegistrar: boolean
}

/**
 * Seção plugável na OrdemDetalhePage substituindo o placeholder da Fase 3.
 * Lista pagamentos + botão de registrar (controlado por status da OS).
 */
export function PagamentosOrdemSection({ ordemId, numero, saldoDevedor, podeRegistrar }: Props) {
  const { data: pagamentos, isLoading } = useListarPagamentosDaOrdem(ordemId)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pagamentos</h2>
        <RegistrarPagamentoDialog
          ordemId={ordemId}
          numero={numero}
          saldoDevedor={saldoDevedor}
          podeRegistrar={podeRegistrar}
        />
      </div>
      {!podeRegistrar && (
        <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          Pagamentos só podem ser registrados em OSs com status <strong>Concluída</strong>.
        </p>
      )}
      <PagamentosTable ordemId={ordemId} pagamentos={pagamentos} loading={isLoading} />
    </section>
  )
}
