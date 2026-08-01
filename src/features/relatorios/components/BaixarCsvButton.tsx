import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useBaixarRelatorioCsv, type BaixarCsvParams } from '../hooks/useBaixarRelatorioCsv'

interface Props {
  params: BaixarCsvParams
  label?: string
}

/** Botão que dispara o download de CSV de um relatório. */
export function BaixarCsvButton({ params, label = 'Baixar CSV' }: Props) {
  const baixar = useBaixarRelatorioCsv()

  return (
    <Button
      type="button"
      variant="outline"
      disabled={baixar.isPending}
      onClick={async () => {
        try {
          await baixar.mutateAsync(params)
        } catch (err) {
          const apiErr = err as { message?: string }
          toast.error(apiErr.message ?? 'Não foi possível baixar o CSV.')
        }
      }}
    >
      <Download className="h-4 w-4" />
      {baixar.isPending ? 'Baixando…' : label}
    </Button>
  )
}
