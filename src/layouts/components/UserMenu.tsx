import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, User } from 'lucide-react'
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

export function UserMenu() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const logout = useLogout()

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
            logout.mutate()
          }}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
