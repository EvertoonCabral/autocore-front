import { type ReactNode, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AuthProvider } from '@/features/auth/auth-context'
import { Toaster } from '@/components/ui/sonner'
import { UNAUTHORIZED_EVENT } from '@/api/client'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { useEffect } from 'react'

function GlobalUnauthorizedToast() {
  useEffect(() => {
    function notify() {
      toast.error('Sessão expirada — faça login novamente.')
    }
    window.addEventListener(UNAUTHORIZED_EVENT, notify)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, notify)
  }, [])
  return null
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  )

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GlobalUnauthorizedToast />
          {children}
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
