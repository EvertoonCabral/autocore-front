import { describe, expect, it, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { TrocarSenhaDialog } from '../components/TrocarSenhaDialog'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

async function preencher(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/senha atual/i), 'atual123')
  await user.type(screen.getByLabelText(/^nova senha$/i), 'novaSenha123')
  await user.type(screen.getByLabelText(/confirmar nova senha/i), 'novaSenha123')
  await user.click(screen.getByRole('button', { name: /salvar/i }))
}

describe('TrocarSenhaDialog', () => {
  it('204: fecha o dialog em caso de sucesso', async () => {
    server.use(
      http.post(`${API}/api/auth/senha`, () => new HttpResponse(null, { status: 204 })),
    )

    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<TrocarSenhaDialog open onOpenChange={onOpenChange} />)

    await preencher(user)

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('422: mapeia erro no campo senhaAtual', async () => {
    server.use(
      http.post(`${API}/api/auth/senha`, () =>
        HttpResponse.json(
          {
            erro: 'Dados inválidos',
            detalhes: [{ campo: 'senhaAtual', mensagem: 'Senha atual incorreta.' }],
          },
          { status: 422 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<TrocarSenhaDialog open onOpenChange={() => {}} />)

    await preencher(user)

    expect(await screen.findByText(/senha atual incorreta/i)).toBeInTheDocument()
  })
})
