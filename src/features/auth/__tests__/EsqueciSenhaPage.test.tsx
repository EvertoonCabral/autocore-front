import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import { server } from '@/test/msw/server'
import { EsqueciSenhaPage } from '../routes/EsqueciSenhaPage'

const API = 'http://localhost:5206'

beforeEach(() => {
  server.resetHandlers()
  server.use(
    http.get(`${API}/api/configuracoes/empresa`, () =>
      HttpResponse.json({ dados: { nomeEmpresa: 'AutoCore', logoHash: null } }),
    ),
  )
})

describe('EsqueciSenhaPage', () => {
  it('mostra confirmação genérica após enviar (mesmo para e-mail desconhecido)', async () => {
    server.use(
      http.post(`${API}/api/auth/esqueci-senha`, () =>
        HttpResponse.json({ dados: 'ok' }),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<EsqueciSenhaPage />)

    await user.type(screen.getByLabelText(/e-mail/i), 'desconhecido@exemplo.com')
    await user.click(screen.getByRole('button', { name: /enviar instruções/i }))

    expect(
      await screen.findByText(/se houver uma conta com este e-mail/i),
    ).toBeInTheDocument()
  })
})
