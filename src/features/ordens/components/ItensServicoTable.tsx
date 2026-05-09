import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { formatBRL } from '@/lib/format'
import type { ItemServicoDto } from '@/api/types'
import { useRemoverItemServico } from '../hooks/useItensServico'

interface Props {
  ordemId: number
  itens: ItemServicoDto[]
  /** Permite remover (apenas em status editáveis). */
  podeEditar: boolean
}

export function ItensServicoTable({ ordemId, itens, podeEditar }: Props) {
  const remover = useRemoverItemServico()

  if (itens.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum serviço adicionado.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serviço</TableHead>
            <TableHead className="w-24 text-right">Qtd.</TableHead>
            <TableHead className="w-32 text-right">Unitário</TableHead>
            <TableHead className="w-32 text-right">Subtotal</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.nomeServico}</TableCell>
              <TableCell className="text-right tabular-nums">{item.quantidade}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(item.precoUnitario ?? 0)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(item.subtotal ?? 0)}
              </TableCell>
              <TableCell>
                {podeEditar && item.id != null && (
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        aria-label={`Remover ${item.nomeServico}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                    title="Remover este serviço?"
                    description={`O item "${item.nomeServico}" será removido da OS.`}
                    confirmLabel="Remover"
                    variant="destructive"
                    pending={remover.isPending}
                    onConfirm={async () => {
                      try {
                        await remover.mutateAsync({ ordemId, itemId: item.id! })
                        toast.success('Serviço removido.')
                      } catch (err) {
                        const apiErr = err as { message?: string }
                        toast.error(apiErr.message ?? 'Não foi possível remover.')
                      }
                    }}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
