import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export interface ConfirmDialogProps {
  /** Elemento que dispara o dialog (botão). */
  trigger: ReactNode
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Use 'destructive' para soft delete, cancelar OS, estornar pagamento. */
  variant?: 'default' | 'destructive'
  /** Disparado ao clicar em confirmar. */
  onConfirm: () => void | Promise<void>
  /** Desabilita o botão de confirmar (ex.: enquanto a mutation roda). */
  pending?: boolean
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  pending = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault()
              void onConfirm()
            }}
            className={cn(variant === 'destructive' && buttonVariants({ variant: 'destructive' }))}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
