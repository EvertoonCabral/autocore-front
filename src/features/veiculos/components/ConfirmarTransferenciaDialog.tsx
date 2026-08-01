import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ConflitoPlacaDto } from '@/api/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Dados do conflito de placa (dono atual + placa). */
  conflito: ConflitoPlacaDto | null
  /** Chamado ao confirmar, com o motivo (obrigatório). */
  onConfirmar: (motivo: string) => void
  pending?: boolean
}

/**
 * Diálogo do fluxo de transferência de placa (HTTP 409 ao criar veículo).
 * Mostra o dono atual + placa e exige um `motivo` para desativar o cadastro
 * anterior. Ao confirmar, reenvia a criação com `confirmarSubstituicao`.
 */
export function ConfirmarTransferenciaDialog({
  open,
  onOpenChange,
  conflito,
  onConfirmar,
  pending = false,
}: Props) {
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  // Limpa o campo sempre que o diálogo abre/fecha.
  useEffect(() => {
    if (!open) {
      setMotivo('')
      setErro(null)
    }
  }, [open])

  function confirmar() {
    const texto = motivo.trim()
    if (!texto) {
      setErro('Informe o motivo da transferência.')
      return
    }
    setErro(null)
    onConfirmar(texto)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Placa já cadastrada</DialogTitle>
          <DialogDescription>
            A placa <strong>{conflito?.placa}</strong> já está cadastrada para{' '}
            <strong>{conflito?.clienteNome}</strong>. Transferir para este cliente? O cadastro
            anterior será desativado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="motivo-transferencia">Motivo da transferência *</Label>
          <Textarea
            id="motivo-transferencia"
            rows={3}
            placeholder="Ex.: veículo vendido para outro cliente."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            aria-invalid={!!erro}
          />
          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={confirmar} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Confirmar transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
