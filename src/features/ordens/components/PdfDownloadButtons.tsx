import { FileText, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'
import {
  useBaixarPdfOrdemServico,
  type TipoPdfOrdem,
} from '../hooks/useBaixarPdfOrdemServico'

interface PdfDownloadButtonsProps {
  ordemId: number
  status: StatusOrdem
  totalGeral: number
  totalPago: number
}

/**
 * Renderiza os botões de impressão da OS conforme o status:
 *  - "Orçamento" em status Aberta/EmAndamento/AguardandoProduto
 *  - "Recibo" em status Concluida E saldo zerado
 *
 * A validação detalhada também ocorre no back; aqui só evitamos botões que
 * o usuário não pode usar.
 */
export function PdfDownloadButtons({
  ordemId,
  status,
  totalGeral,
  totalPago,
}: PdfDownloadButtonsProps) {
  const baixar = useBaixarPdfOrdemServico()

  const emAberto = status === 1 || status === 2 || status === 3
  const totalmentePaga = status === 4 && totalPago >= totalGeral

  if (!emAberto && !totalmentePaga) return null

  const handleClick = async (tipo: TipoPdfOrdem) => {
    try {
      await baixar.mutateAsync({ id: ordemId, tipo })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao gerar PDF.'
      toast.error(msg)
    }
  }

  return (
    <>
      {emAberto && (
        <Button
          variant="outline"
          onClick={() => handleClick('orcamento')}
          disabled={baixar.isPending}
        >
          <FileText className="h-4 w-4" />
          Imprimir orçamento
        </Button>
      )}
      {totalmentePaga && (
        <Button
          variant="outline"
          onClick={() => handleClick('recibo')}
          disabled={baixar.isPending}
        >
          <Receipt className="h-4 w-4" />
          Imprimir recibo
        </Button>
      )}
    </>
  )
}
