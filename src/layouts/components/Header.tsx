import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BadgeNotificacoes } from '@/features/notificacoes/components/BadgeNotificacoes'
import { ThemeToggle } from '@/shared/theme/ThemeToggle'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  /** Abre o drawer da sidebar no mobile (botão hambúrguer). */
  onOpenMenu: () => void
}

export function Header({ onOpenMenu }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-appbar-border bg-appbar px-4 text-appbar-foreground md:px-6">
      <div className="flex items-center gap-3">
        {/* A marca fica só na sidebar. No mobile, hambúrguer abre o drawer. */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menu"
          onClick={onOpenMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <BadgeNotificacoes />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
