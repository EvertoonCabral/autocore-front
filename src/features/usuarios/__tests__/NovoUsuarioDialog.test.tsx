import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { NovoUsuarioDialog } from '../components/NovoUsuarioDialog'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

describe('<NovoUsuarioDialog>', () => {
  it('preenche, submete e fecha o dialog em sucesso', async () => {
    let postBody: unknown = null
    server.use(
      http.post(`${API}/api/auth/usuarios`, async ({ request }) => {
        postBody = await request.json()
        return HttpResponse.json({ dados: { id: 42 } }, { status: 201 })
      }),
    )

    let open = true
    function onOpenChange(o: boolean) {
      open = o
    }
    const { rerender } = renderWithProviders(
      <NovoUsuarioDialog open={true} onOpenChange={onOpenChange} />,
      { withAuth: false },
    )

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/nome completo/i), 'Maria Operadora')
    await user.type(screen.getByLabelText(/e-?mail/i), 'maria@autocore.com')
    await user.type(screen.getByLabelText(/senha temporária/i), 'senha1234')

    await user.click(screen.getByRole('button', { name: /criar usuário/i }))

    await waitFor(() => expect(postBody).not.toBeNull())
    expect(postBody).toMatchObject({
      nomeCompleto: 'Maria Operadora',
      email: 'maria@autocore.com',
      senha: 'senha1234',
      role: 'Operador',
    })

    await waitFor(() => expect(open).toBe(false))

    // Simular o re-render com open=false (parent fechando)
    rerender(<NovoUsuarioDialog open={false} onOpenChange={onOpenChange} />)
  })

  it('mostra erros de validação zod quando campos estão vazios', async () => {
    renderWithProviders(<NovoUsuarioDialog open={true} onOpenChange={() => {}} />, {
      withAuth: false,
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /criar usuário/i }))

    await waitFor(() => {
      expect(screen.getByText(/nome deve ter pelo menos 3/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/e-mail é obrigatório/i)).toBeInTheDocument()
    expect(screen.getByText(/senha deve ter pelo menos 8/i)).toBeInTheDocument()
  })

  it('distribui detalhes de 422 nos campos correspondentes', async () => {
    server.use(
      http.post(`${API}/api/auth/usuarios`, () =>
        HttpResponse.json(
          {
            erro: 'Dados inválidos.',
            detalhes: [
              { campo: 'email', mensagem: 'E-mail já cadastrado.' },
              { campo: 'senha', mensagem: 'Senha deve conter dígito.' },
            ],
          },
          { status: 422 },
        ),
      ),
    )

    renderWithProviders(<NovoUsuarioDialog open={true} onOpenChange={() => {}} />, {
      withAuth: false,
    })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/nome completo/i), 'Maria Silva')
    await user.type(screen.getByLabelText(/e-?mail/i), 'maria@autocore.com')
    await user.type(screen.getByLabelText(/senha temporária/i), 'senha1234')
    await user.click(screen.getByRole('button', { name: /criar usuário/i }))

    await waitFor(() => {
      expect(screen.getByText(/e-mail já cadastrado/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/senha deve conter dígito/i)).toBeInTheDocument()
  })
})
