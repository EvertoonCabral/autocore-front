import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '@/test/render'
import { LoginForm } from '../components/LoginForm'

// Com o client id configurado, o botão "Entrar com Google" deve ser renderizado.
vi.mock('@/lib/env', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:5206',
    VITE_GOOGLE_CLIENT_ID: 'test-client-id',
  },
}))

describe('LoginForm — botão do Google (client id configurado)', () => {
  it('renderiza o container do botão do Google', () => {
    renderWithProviders(<LoginForm onSuccess={() => {}} />)
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument()
  })
})
