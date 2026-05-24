import { Link } from 'react-router-dom'
import { Bell, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePendencias } from '../hooks/usePendencias'

/**
 * Sino de notificações no header — mostra um badge com o total de
 * pendências (vencidas + aguardando produto há +7 dias). Click abre
 * dropdown com link para cada categoria.
 *
 * Quando não há pendências, o sino aparece sem badge (estado neutro).
 * Falhas de carga são silenciosas — o sino fica visível mas sem badge.
 */
export function BadgeNotificacoes() {
  const { data } = usePendencias()

  const vencidas = data?.pendenciasVencidas ?? 0
  const aguardando = data?.ossAguardandoProdutoHa7Dias ?? 0
  const total = vencidas + aguardando

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notificações${total > 0 ? ` (${total})` : ''}`}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-xs"
            >
              {total > 99 ? '99+' : total}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Pendências</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {total === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Tudo em dia.
          </div>
        ) : (
          <>
            {vencidas > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  to="/ordens?status=4&pendentes=vencidas"
                  className="flex items-start gap-3"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {vencidas} {vencidas === 1 ? 'OS vencida' : 'OSs vencidas'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Concluídas com saldo devedor
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}
            {aguardando > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  to="/ordens?status=3"
                  className="flex items-start gap-3"
                >
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {aguardando}{' '}
                      {aguardando === 1
                        ? 'OS aguardando produto'
                        : 'OSs aguardando produto'}
                    </div>
                    <div className="text-xs text-muted-foreground">Há 7 dias ou mais</div>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
