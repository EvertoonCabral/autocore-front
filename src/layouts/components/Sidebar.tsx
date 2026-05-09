import { NavLink } from 'react-router-dom'
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings2,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
}

const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users, end: false },
  { to: '/servicos', label: 'Catálogo', icon: Settings2, end: false },
  { to: '/produtos', label: 'Produtos', icon: Package, end: false },
  { to: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList, end: false },
  // Próximos: Pendências, Cobranças, Configurações
]

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Wrench className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold">AutoCore</span>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Menu principal">
        {items.map((item) => (
          <NavLink
            key={item.to}
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
        ))}
      </nav>
    </aside>
  )
}
