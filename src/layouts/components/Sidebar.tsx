import { NavLink } from 'react-router-dom'
import {
  Car,
  ClipboardList,
  CreditCard,
  FileSearch,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useCan } from '@/shared/components/Can'
import { MarcaEmpresa } from '@/shared/components/MarcaEmpresa'
import type { Permission } from '@/shared/guards/permissions'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
  permission?: Permission
}

const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users, end: false },
  { to: '/veiculos', label: 'Veículos', icon: Car, end: false },
  { to: '/servicos', label: 'Serviços', icon: Settings2, end: false },
  { to: '/produtos', label: 'Produtos', icon: Package, end: false },
  { to: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList, end: false },
  { to: '/pendencias', label: 'Pendências', icon: CreditCard, end: false },
  { to: '/cobrancas', label: 'Cobranças', icon: MessageCircle, end: false },
  {
    to: '/relatorios/auditoria',
    label: 'Auditoria',
    icon: FileSearch,
    end: false,
    permission: 'auditoria.ver',
  },
  // Configurações fica no UserMenu (Admin-only)
]

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <MarcaEmpresa size="sm" fallback="icon-square" />
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Menu principal">
        {items.map((item) => (
          <SidebarItem key={item.to} item={item} />
        ))}
      </nav>
    </aside>
  )
}

function SidebarItem({ item }: { item: NavItem }) {
  const allowed = useCan(item.permission ?? 'configuracoes.ler')
  // Itens sem `permission` são sempre exibidos. O hook chama useCan
  // de forma incondicional para respeitar as regras de hooks.
  if (item.permission && !allowed) return null

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )
      }
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </NavLink>
  )
}
