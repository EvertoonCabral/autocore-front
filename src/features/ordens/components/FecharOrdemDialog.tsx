import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OrdemServicoResumoDto } from '@/api/types'
import { useFecharOrdem } from '../hooks/useFecharOrdem'

interface Props {
  ordem: OrdemServicoResumoDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Chamado após o fechamento ser confirmado com sucesso. */
  onConfirmed?: () => void
}

const DIAS_PADRAO = 5

/**
 * Diálogo de confirmação para fechar uma OS (arraste até a coluna Concluída,
 * ou botão dedicado). Coleta os dias para vencimento e chama `useFecharOrdem`.
 */
export function FecharOrdemDialog({ ordem, open, onOpenChange, onConfirmed }: Props) {
  const [dias, setDias] = useState(DIAS_PADRAO)
  const fechar = useFecharOrdem()

  // Reseta os dias sempre que uma nova OS entra no diálogo.
  useEffect(() => {
    if (open) setDias(DIAS_PADRAO)
  }, [open, ordem?.id])

  async function confirmar() {
    if (ordem?.id == null) return
    try {
      await fechar.mutateAsync({ id: ordem.id, diasParaVencimento: dias })
      toast.success(`OS ${ordem.numero ?? ''} fechada.`)
      onOpenChange(false)
      onConfirmed?.()
    } catch {
      toast.error('Não foi possível fechar a OS.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechar ordem de serviço</DialogTitle>
          <DialogDescription>
            {ordem
              ? `${ordem.numero ?? 'OS'} — ${ordem.clienteNome ?? 'Cliente'}`
              : 'Confirme o fechamento da OS.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="fechar-dias">Dias para vencimento</Label>
          <Input
            id="fechar-dias"
            type="number"
            min={0}
            className="w-32"
            value={dias}
            onChange={(e) => setDias(Math.max(0, Number(e.target.value) || 0))}
          />
          <p className="text-xs text-muted-foreground">
            O vencimento do pagamento será calculado a partir de hoje.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={fechar.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void confirmar()} disabled={fechar.isPending || ordem == null}>
            {fechar.isPending ? 'Fechando…' : 'Fechar OS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
