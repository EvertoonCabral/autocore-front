import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import type { ItemProdutoDto } from '@/api/types'
import { useRemoverItemProduto } from '../hooks/useItensProduto'

interface Props {
  ordemId: number
  itens: ItemProdutoDto[]
  podeEditar: boolean
}

export function ItensProdutoTable({ ordemId, itens, podeEditar }: Props) {
  const remover = useRemoverItemProduto()

  if (itens.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum produto adicionado.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="w-24 text-right">Qtd.</TableHead>
            <TableHead className="w-32 text-right">Unitário</TableHead>
            <TableHead className="w-32 text-right">Subtotal</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => {
            const fornecidoPeloCliente = item.produtoFornecidoPeloCliente
            const avulso = item.produtoId == null
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{item.nomeProduto}</span>
                    <div className="flex flex-wrap gap-1">
                      {avulso && (
                        <Badge variant="outline" className="text-xs">
                          Avulso
                        </Badge>
                      )}
                      {fornecidoPeloCliente && (
                        <Badge variant="secondary" className="text-xs">
                          Fornecido pelo cliente
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{item.quantidade}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {fornecidoPeloCliente
                    ? '—'
                    : formatBRL(item.precoUnitario ?? 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fornecidoPeloCliente ? '—' : formatBRL(item.subtotal ?? 0)}
                </TableCell>
                <TableCell>
                  {podeEditar && item.id != null && (
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          aria-label={`Remover ${item.nomeProduto}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      title="Remover este produto?"
                      description={
                        <span>
                          O item <strong>{item.nomeProduto}</strong> será removido da OS.
                          {!fornecidoPeloCliente && !avulso && (
                            <> O estoque do produto será estornado.</>
                          )}
                        </span>
                      }
                      confirmLabel="Remover"
                      variant="destructive"
                      pending={remover.isPending}
                      onConfirm={async () => {
                        try {
                          await remover.mutateAsync({ ordemId, itemId: item.id! })
                          toast.success('Produto removido.')
                        } catch (err) {
                          const apiErr = err as { message?: string }
                          toast.error(apiErr.message ?? 'Não foi possível remover.')
                        }
                      }}
                    />
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
