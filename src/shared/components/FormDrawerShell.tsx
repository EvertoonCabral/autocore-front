import type { ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface FormDrawerShellProps {
  title: string
  description?: string | undefined
  /**
   * Form "sujo"? Quando `true`, fechar por overlay/Esc/botão-X pede confirmação
   * antes de descartar. O submit bem-sucedido deve chamar `onClose` direto
   * (sem passar por aqui) já que não há nada a descartar.
   */
  dirty?: boolean
  /** Navega de volta para a lista (fecha o drawer de fato). */
  onClose: () => void
  children: ReactNode
}

/**
 * Casca do drawer de cadastro (Cliente/Produto/Serviço/Veículo). Renderiza um
 * `Sheet` (lateral direita) sempre aberto — o fechamento é controlado via
 * `onClose` (navegação), o que mantém a URL como fonte da verdade e deep-linkável.
 *
 * Guarda contra fechamento acidental: se o form estiver `dirty`, um
 * `window.confirm` pede confirmação antes de descartar (padrão simples e
 * correto — o `ConfirmDialog` do projeto é orientado a trigger, não a fluxo
 * imperativo de "ao fechar, pergunte").
 */
export function FormDrawerShell({
  title,
  description,
  dirty = false,
  onClose,
  children,
}: FormDrawerShellProps) {
  function requestClose() {
    if (dirty && !window.confirm('Descartar as alterações não salvas?')) return
    onClose()
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) requestClose()
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full max-w-xl flex-col gap-0 overflow-y-auto p-0 sm:w-[34rem] sm:max-w-none"
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <SheetHeader className="border-b border-border-faint">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="p-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
