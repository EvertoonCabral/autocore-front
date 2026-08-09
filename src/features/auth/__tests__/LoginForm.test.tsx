import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { LoginForm } from '../components/LoginForm'

const API = 'http://localhost:5206'

beforeEach(() => {
  server.resetHandlers()
})

describe('LoginForm', () => {
  it('não renderiza o botão do Google quando VITE_GOOGLE_CLIENT_ID está vazio', () => {
    renderWithProviders(<LoginForm onSuccess={() => {}} />)
    expect(screen.queryByTestId('google-login-button')).not.toBeInTheDocument()
  })

  it('exibe o link "Esqueci minha senha"', () => {
    renderWithProviders(<LoginForm onSuccess={() => {}} />)
    expect(screen.getByRole('link', { name: /esqueci minha senha/i })).toHaveAttribute(
      'href',
      '/esqueci-senha',
    )
  })

  it('valida campos obrigatórios antes de submeter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm onSuccess={() => {}} />)

    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/informe o e-mail/i)).toBeInTheDocument()
    expect(screen.getByText(/informe a senha/i)).toBeInTheDocument()
  })

  it('chama onSuccess quando o login retorna 200', async () => {
    server.use(
      http.post(`${API}/api/auth/login`, () =>
        HttpResponse.json({
          dados: {
            token: 'jwt',
            email: 'admin@autocore.com',
            nomeCompleto: 'Administrador',
            role: 'Admin',
            expiraEm: new Date(Date.now() + 3600_000).toISOString(),
          },
        }),
      ),
      http.get(`${API}/api/auth/me`, () =>
        HttpResponse.json({
          dados: {
            id: 1,
            nomeCompleto: 'Administrador',
            email: 'admin@autocore.com',
            role: 'Admin',
            ativo: true,
          },
        }),
      ),
    )

    let success = false
    const user = userEvent.setup()
    renderWithProviders(<LoginForm onSuccess={() => (success = true)} />)

    await user.type(screen.getByLabelText(/e-mail/i), 'admin@autocore.com')
    await user.type(screen.getByLabelText(/senha/i), 'AutoCore@2024!')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(success).toBe(true))
  })

  it('mantém o usuário na tela e mostra mensagem quando 401', async () => {
    server.use(
      http.post(`${API}/api/auth/login`, () =>
        HttpResponse.json({ erro: 'Credenciais inválidas.' }, { status: 401 }),
      ),
    )

    let success = false
    const user = userEvent.setup()
    renderWithProviders(<LoginForm onSuccess={() => (success = true)} />)

    await user.type(screen.getByLabelText(/e-mail/i), 'admin@autocore.com')
    await user.type(screen.getByLabelText(/senha/i), 'errada')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(success).toBe(false)
    })
  })
})
