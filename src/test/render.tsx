import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/auth-context'

export interface RenderProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps
  queryClient?: QueryClient
  withAuth?: boolean
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(ui: ReactElement, options: RenderProvidersOptions = {}) {
  const {
    routerProps,
    queryClient = makeQueryClient(),
    withAuth = true,
    ...renderOptions
  } = options

  function Wrapper({ children }: { children: ReactNode }) {
    const inner = withAuth ? <AuthProvider>{children}</AuthProvider> : children
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter {...routerProps}>{inner}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

export * from '@testing-library/react'
