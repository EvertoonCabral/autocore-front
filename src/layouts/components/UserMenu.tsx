import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, Settings, User, Users } from 'lucide-react'
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
import { useAuth } from '@/features/auth/auth-context'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { TrocarSenhaDialog } from '@/features/auth/components/TrocarSenhaDialog'

export function UserMenu() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const logout = useLogout()
  const [trocarSenhaAberto, setTrocarSenhaAberto] = useState(false)

  if (!user) return null

  const isAdmin = user.role === 'Admin'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden max-w-[200px] truncate sm:inline">{user.nomeCompleto}</span>
          <Badge variant={isAdmin ? 'default' : 'secondary'}>{user.role}</Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span>{user.nomeCompleto}</span>
          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                navigate('/usuarios')
              }}
            >
              <Users className="h-4 w-4" />
              Usuários
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                navigate('/configuracoes')
              }}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            setTrocarSenhaAberto(true)
          }}
        >
          <KeyRound className="h-4 w-4" />
          Trocar senha
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            logout.mutate()
          }}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
      <TrocarSenhaDialog open={trocarSenhaAberto} onOpenChange={setTrocarSenhaAberto} />
    </DropdownMenu>
  )
}
