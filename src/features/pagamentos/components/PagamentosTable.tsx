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
import { Skeleton } from '@/components/ui/skeleton'
import { Can } from '@/shared/components/Can'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { formatBRL, formatDataHora } from '@/lib/format'
import {
  FORMA_PAGAMENTO_META,
  type FormaPagamento,
} from '@/shared/enums/formaPagamento'
import type { PagamentoDto } from '@/api/types'
import { useEstornarPagamento } from '../hooks/useEstornarPagamento'

interface Props {
  ordemId: number
  pagamentos: PagamentoDto[] | undefined
  loading?: boolean
}

export function PagamentosTable({ ordemId, pagamentos, loading }: Props) {
  const estornar = useEstornarPagamento()

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (!pagamentos || pagamentos.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum pagamento registrado nesta OS.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">Pago em</TableHead>
            <TableHead className="w-40">Forma</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Observação</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagamentos.map((p) => {
            const meta = FORMA_PAGAMENTO_META[p.forma as FormaPagamento]
            return (
              <TableRow key={p.id}>
                <TableCell className="tabular-nums">{formatDataHora(p.pagoEm)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden>{meta?.marca}</span>
                    <span>{meta?.label ?? p.forma}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatBRL(p.valor ?? 0)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.observacao ?? '—'}
                </TableCell>
                <TableCell>
                  <Can permission="pagamentos.estornar">
                    {p.id != null && (
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            aria-label={`Estornar pagamento de ${formatBRL(p.valor ?? 0)}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Estornar este pagamento?"
                        description={
                          <span>
                            O pagamento de <strong>{formatBRL(p.valor ?? 0)}</strong> ({meta?.label})
                            será removido da OS. O saldo devedor voltará a refletir a soma original.
                            Esta ação não pode ser desfeita.
                          </span>
                        }
                        confirmLabel="Estornar"
                        variant="destructive"
                        pending={estornar.isPending}
                        onConfirm={async () => {
                          try {
                            await estornar.mutateAsync({
                              pagamentoId: p.id!,
                              ordemId,
                            })
                            toast.success('Pagamento estornado.')
                          } catch (err) {
                            const apiErr = err as { message?: string }
                            toast.error(
                              apiErr.message ?? 'Não foi possível estornar o pagamento.',
                            )
                          }
                        }}
                      />
                    )}
                  </Can>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
