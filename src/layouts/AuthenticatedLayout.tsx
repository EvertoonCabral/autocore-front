import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { Sidebar, SidebarContent } from './components/Sidebar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { RouteFallback } from '@/app/RouteFallback'

export function AuthenticatedLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Fecha o drawer ao trocar de rota (defesa: onNavigate já cobre cliques).
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar fixa (desktop) */}
      <Sidebar />

      {/* Drawer da sidebar (mobile < md) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0 md:hidden">
          <SheetTitle className="sr-only">Menu principal</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-6 pb-8 pt-[26px] max-[1024px]:px-4">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
