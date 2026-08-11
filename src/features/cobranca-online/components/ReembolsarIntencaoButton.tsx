import { useState } from 'react'
import { Loader2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Can } from '@/shared/components/Can'
import { formatBRL } from '@/lib/format'
import { useReembolsarIntencao } from '../hooks/useReembolsarIntencao'
import type { IntencaoPagamentoDto } from '../hooks/useCobrancaOnlineKeys'

interface Props {
  ordemId: number
  intencao: IntencaoPagamentoDto
}

/**
 * Reembolso de uma cobrança aprovada (Admin). Total por padrão; aceita valor
 * parcial quando a cobrança ainda não virou pagamento na OS (o back rejeita
 * parcial de pagamento já registrado). Se a cobrança foi convertida, o
 * pagamento vinculado é estornado no mesmo fluxo.
 */
export function ReembolsarIntencaoButton({ ordemId, intencao }: Props) {
  const [open, setOpen] = useState(false)
  const [valorStr, setValorStr] = useState('')
  const reembolsar = useReembolsarIntencao(ordemId)

  const valorNum = valorStr.trim() === '' ? undefined : Number(valorStr.replace(',', '.'))
  const parcialInvalido =
    valorNum !== undefined &&
    (!Number.isFinite(valorNum) || valorNum <= 0 || valorNum > (intencao.valorCobrado ?? 0) + 0.001)

  async function submit() {
    try {
      await reembolsar.mutateAsync({ id: intencao.id as number, valor: valorNum })
      toast.success('Reembolso efetuado.')
      setOpen(false)
      setValorStr('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível reembolsar.'
      toast.error(msg)
    }
  }

  return (
    <Can permission="cobrancaOnline.reembolsar">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Undo2 className="h-3.5 w-3.5" />
            Reembolsar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reembolsar cobrança</DialogTitle>
            <DialogDescription>
              Valor cobrado: <strong>{formatBRL(intencao.valorCobrado)}</strong>. Deixe em branco
              para reembolso total. Se a cobrança já virou pagamento na OS, o pagamento é estornado
              e o reembolso é sempre total.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reembolso-valor">Valor parcial (opcional)</Label>
            <Input
              id="reembolso-valor"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              placeholder="Total"
              value={valorStr}
              onChange={(e) => setValorStr(e.target.value)}
              aria-invalid={parcialInvalido}
            />
            {parcialInvalido && (
              <p role="alert" className="text-sm text-destructive">
                Informe um valor entre R$ 0,01 e {formatBRL(intencao.valorCobrado)}.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={reembolsar.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={submit}
              disabled={reembolsar.isPending || parcialInvalido}
            >
              {reembolsar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Reembolsar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Can>
  )
}
