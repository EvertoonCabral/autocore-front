import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  Car,
  ClipboardList,
  CreditCard,
  FileSearch,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Settings2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useCan } from '@/shared/components/Can'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { MarcaEmpresa } from '@/shared/components/MarcaEmpresa'
import { useLogout } from '@/features/auth/hooks/useLogout'
import type { Permission } from '@/shared/guards/permissions'
import { useSidebarContadores } from './useSidebarContadores'

/** Chave do contador exibido no item (ver useSidebarContadores). */
type BadgeKey = 'pendencias' | 'cobrancas' | 'ordens'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
  permission?: Permission
  badge?: BadgeKey
}

const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users, end: false },
  { to: '/veiculos', label: 'Veículos', icon: Car, end: false },
  { to: '/servicos', label: 'Serviços', icon: Settings2, end: false },
  { to: '/produtos', label: 'Produtos', icon: Package, end: false },
  {
    to: '/ordens',
    label: 'Ordens de Serviço',
    icon: ClipboardList,
    end: false,
    badge: 'ordens',
  },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, end: false },
  { to: '/pendencias', label: 'Pendências', icon: CreditCard, end: false, badge: 'pendencias' },
  { to: '/cobrancas', label: 'Cobranças', icon: MessageCircle, end: false, badge: 'cobrancas' },
  {
    to: '/relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    end: false,
    permission: 'relatorios.ver',
  },
  {
    to: '/relatorios/auditoria',
    label: 'Auditoria',
    icon: FileSearch,
    end: false,
    permission: 'auditoria.ver',
  },
  // Configurações fica no UserMenu (Admin-only)
]

/**
 * Conteúdo da sidebar (marca + navegação) — compartilhado entre a `<aside>`
 * fixa do desktop e o drawer mobile (Sheet). `onNavigate` fecha o drawer ao
 * clicar num item no mobile.
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const contadores = useSidebarContadores()
  const logout = useLogout()

  return (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-border-faint px-6">
        <MarcaEmpresa size="md" fallback="icon-square" label="AutoCore" />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Menu principal">
        {items.map((item) => (
          <SidebarItem key={item.to} item={item} contadores={contadores} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="shrink-0 border-t border-border-faint p-3">
        <ConfirmDialog
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Sair</span>
            </button>
          }
          title="Sair da aplicação?"
          description="Você será desconectado e voltará para a tela de login."
          confirmLabel="Sair"
          onConfirm={() => logout.mutate()}
          pending={logout.isPending}
        />
      </div>
    </>
  )
}

/** Sidebar fixa (desktop ≥ md). No mobile some — vira drawer no layout. */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
      <SidebarContent />
    </aside>
  )
}

interface SidebarItemProps {
  item: NavItem
  contadores: ReturnType<typeof useSidebarContadores>
  onNavigate?: (() => void) | undefined
}

function SidebarItem({ item, contadores, onNavigate }: SidebarItemProps) {
  const allowed = useCan(item.permission ?? 'configuracoes.ler')
  // Itens sem `permission` são sempre exibidos. O hook chama useCan
  // de forma incondicional para respeitar as regras de hooks.
  if (item.permission && !allowed) return null

  const valor = item.badge ? contadores[item.badge] : 0
  const alerta = item.badge === 'pendencias'

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {valor > 0 &&
        (alerta ? (
          <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-pill bg-danger-soft px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-danger">
            {valor > 99 ? '99+' : valor}
          </span>
        ) : (
          <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center text-[11px] font-medium tabular-nums text-muted-foreground">
            {valor > 99 ? '99+' : valor}
          </span>
        ))}
    </NavLink>
  )
}
