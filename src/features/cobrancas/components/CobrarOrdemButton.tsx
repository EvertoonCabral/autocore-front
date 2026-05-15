import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { formatBRL, formatTelefone, formatData } from '@/lib/format'
import { useCobrarOrdem } from '../hooks/useCobrarOrdem'

interface Props {
  ordemServicoId: number
  numero: string
  clienteNome: string
  clienteTelefone: string
  saldoDevedor: number
  /** Pode ser null/undefined em OS recém-concluída sem data ainda definida. */
  dataVencimento?: string | null | undefined
  vencida?: boolean
  size?: 'sm' | 'default'
  /** Quando true, renderiza um botão menor com ícone apenas; quando false, com label. */
  iconOnly?: boolean
}

/**
 * Botão "Cobrar agora" reutilizável — `/pendencias` (linha) e detalhe da OS.
 * Aberto a Operador e Admin (sem gating por `<Can>`); back valida.
 */
export function CobrarOrdemButton({
  ordemServicoId,
  numero,
  clienteNome,
  clienteTelefone,
  saldoDevedor,
  dataVencimento,
  vencida,
  size = 'sm',
  iconOnly = false,
}: Props) {
  const cobrar = useCobrarOrdem()

  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="outline"
          size={size}
          disabled={cobrar.isPending}
          aria-label={`Cobrar ${numero} via WhatsApp`}
        >
          <Send className="h-4 w-4" />
          {!iconOnly && 'Cobrar agora'}
        </Button>
      }
      title={vencida ? 'Cobrar OS vencida?' : 'Cobrar antes do vencimento?'}
      description={
        <span className="space-y-2 text-sm">
          <span className="block">
            Será enviado WhatsApp para <strong>{clienteNome}</strong> no telefone{' '}
            <span className="tabular-nums">{formatTelefone(clienteTelefone)}</span>{' '}
            informando o saldo devedor de{' '}
            <strong className="text-destructive">{formatBRL(saldoDevedor)}</strong>{' '}
            referente à OS <span className="font-mono text-xs">{numero}</span>.
          </span>
          {dataVencimento && (
            <span className="block text-xs text-muted-foreground">
              {vencida
                ? `Vencida em ${formatData(dataVencimento)}.`
                : `Vencimento em ${formatData(dataVencimento)} — cobrança proativa, antes do prazo.`}
            </span>
          )}
          <span className="block text-xs text-muted-foreground">
            Idempotência diária: se já houver envio com sucesso hoje, o back não duplica.
          </span>
        </span>
      }
      confirmLabel="Enviar cobrança"
      pending={cobrar.isPending}
      onConfirm={async () => {
        try {
          const r = await cobrar.mutateAsync(ordemServicoId)
          switch (r.status) {
            case 'Enviada':
              toast.success(`Cobrança enviada para ${clienteNome}.`)
              break
            case 'JaEnviadaHoje':
              toast.info(r.mensagem ?? 'Já enviado hoje (idempotência diária).')
              break
            case 'Falha':
              toast.error(
                r.erroEnvio
                  ? `Falha no envio: ${r.erroEnvio}`
                  : (r.mensagem ?? 'Falha no envio.'),
              )
              break
            case 'OsInvalida':
              toast.error(r.mensagem ?? 'OS não pode receber cobrança.')
              break
            default:
              toast.message(r.mensagem ?? 'Operação concluída.')
          }
        } catch (err) {
          const apiErr = err as { message?: string }
          toast.error(apiErr.message ?? 'Não foi possível disparar a cobrança.')
        }
      }}
    />
  )
}
