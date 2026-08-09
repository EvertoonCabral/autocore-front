import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import { server } from '@/test/msw/server'
import { RedefinirSenhaPage } from '../routes/RedefinirSenhaPage'

const API = 'http://localhost:5206'

beforeEach(() => {
  server.resetHandlers()
  server.use(
    http.get(`${API}/api/configuracoes/empresa`, () =>
      HttpResponse.json({ dados: { nomeEmpresa: 'AutoCore', logoHash: null } }),
    ),
  )
})

function renderComLink(query: string) {
  return renderWithProviders(<RedefinirSenhaPage />, {
    routerProps: { initialEntries: [`/redefinir-senha${query}`] },
  })
}

describe('RedefinirSenhaPage', () => {
  it('happy path: 204 mostra painel de sucesso', async () => {
    server.use(
      http.post(`${API}/api/auth/redefinir-senha`, () => new HttpResponse(null, { status: 204 })),
    )

    const user = userEvent.setup()
    renderComLink('?email=user@exemplo.com&token=abc123')

    await user.type(screen.getByLabelText(/^nova senha$/i), 'novaSenha123')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'novaSenha123')
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }))

    expect(await screen.findByText(/sua senha foi redefinida/i)).toBeInTheDocument()
  })

  it('400: link inválido/expirado mostra mensagem de link inválido', async () => {
    server.use(
      http.post(`${API}/api/auth/redefinir-senha`, () =>
        HttpResponse.json({ erro: 'Link inválido.' }, { status: 400 }),
      ),
    )

    const user = userEvent.setup()
    renderComLink('?email=user@exemplo.com&token=expirado')

    await user.type(screen.getByLabelText(/^nova senha$/i), 'novaSenha123')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'novaSenha123')
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }))

    expect(await screen.findByText(/o link é inválido ou expirou/i)).toBeInTheDocument()
  })

  it('sem token na URL: mostra estado de link inválido', () => {
    renderComLink('?email=user@exemplo.com')
    expect(screen.getByText(/o link é inválido ou expirou/i)).toBeInTheDocument()
  })
})
