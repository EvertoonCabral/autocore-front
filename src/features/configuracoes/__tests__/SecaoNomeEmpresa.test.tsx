import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { SecaoNomeEmpresa } from '../components/SecaoNomeEmpresa'
import type { ConfiguracaoEmpresaDto } from '@/api/types'

const API = 'http://localhost:5206'

const baseDto: ConfiguracaoEmpresaDto = {
  nomeEmpresa: 'Auto Elétrica Central',
  logoHash: null,
  logoMimeType: null,
}

beforeEach(() => server.resetHandlers())

describe('<SecaoNomeEmpresa>', () => {
  it('renderiza com o nome atual e botão Salvar desabilitado', () => {
    renderWithProviders(<SecaoNomeEmpresa configuracao={baseDto} />, { withAuth: false })

    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue('Auto Elétrica Central')
    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled()
  })

  it('submete o novo nome e chama o PUT do back', async () => {
    let bodyRecebido: unknown = null
    server.use(
      http.put(`${API}/api/configuracoes/empresa`, async ({ request }) => {
        bodyRecebido = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<SecaoNomeEmpresa configuracao={baseDto} />, { withAuth: false })

    const user = userEvent.setup()
    const input = screen.getByLabelText(/nome da empresa/i)
    await user.clear(input)
    await user.type(input, 'Oficina XYZ')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(bodyRecebido).not.toBeNull())
    expect(bodyRecebido).toEqual({ nomeEmpresa: 'Oficina XYZ' })
  })

  it('422 com mensagem sobre nome distribui o erro para o campo', async () => {
    server.use(
      http.put(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json(
          {
            erro: 'Dados inválidos',
            detalhes: [{ campo: 'nomeEmpresa', mensagem: 'Nome inválido — máximo 150 caracteres.' }],
          },
          { status: 422 },
        ),
      ),
    )

    renderWithProviders(<SecaoNomeEmpresa configuracao={baseDto} />, { withAuth: false })

    const user = userEvent.setup()
    const input = screen.getByLabelText(/nome da empresa/i)
    await user.clear(input)
    await user.type(input, 'Nome novo')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() =>
      expect(screen.getByText(/nome inválido — máximo 150 caracteres/i)).toBeInTheDocument(),
    )
  })

  it('bloqueia submit quando nome vazio (validação local)', async () => {
    renderWithProviders(<SecaoNomeEmpresa configuracao={baseDto} />, { withAuth: false })

    const user = userEvent.setup()
    const input = screen.getByLabelText(/nome da empresa/i)
    await user.clear(input)
    // Botão fica habilitado por estar dirty, mas o resolver bloqueia o submit
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() =>
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument(),
    )
  })
})
