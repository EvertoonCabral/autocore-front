import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import type { UsuarioDto } from '@/api/types'
import { EditarUsuarioDialog } from '../components/EditarUsuarioDialog'

const API = 'http://localhost:5206'

const outroUsuario: UsuarioDto = {
  id: 2,
  nomeCompleto: 'Maria Operadora',
  email: 'maria@autocore.com',
  role: 'Operador',
  ativo: true,
  podeVerAuditoria: false,
}

const proprioUsuario: UsuarioDto = {
  id: 1,
  nomeCompleto: 'Administrador',
  email: 'admin@autocore.com',
  role: 'Admin',
  ativo: true,
  podeVerAuditoria: true,
}

beforeEach(() => server.resetHandlers())

describe('<EditarUsuarioDialog>', () => {
  it('switch Ativo fica DESABILITADO quando é o próprio usuário', () => {
    renderWithProviders(
      <EditarUsuarioDialog
        usuario={proprioUsuario}
        usuarioCorrenteId={1}
        open={true}
        onOpenChange={() => {}}
      />,
      { withAuth: false },
    )

    const switchEl = screen.getByRole('switch', { name: /ativo/i })
    expect(switchEl).toBeDisabled()
    expect(
      screen.getByText(/você não pode desativar seu próprio usuário/i),
    ).toBeInTheDocument()
  })

  it('switch Ativo fica HABILITADO para outro usuário', () => {
    renderWithProviders(
      <EditarUsuarioDialog
        usuario={outroUsuario}
        usuarioCorrenteId={1}
        open={true}
        onOpenChange={() => {}}
      />,
      { withAuth: false },
    )

    const switchEl = screen.getByRole('switch', { name: /ativo/i })
    expect(switchEl).not.toBeDisabled()
  })

  it('senha em branco → payload SEM novaSenha', async () => {
    let putBody: unknown = null
    server.use(
      http.put(`${API}/api/auth/usuarios/2`, async ({ request }) => {
        putBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(
      <EditarUsuarioDialog
        usuario={outroUsuario}
        usuarioCorrenteId={1}
        open={true}
        onOpenChange={() => {}}
      />,
      { withAuth: false },
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(putBody).not.toBeNull())
    expect(putBody).toEqual({
      nomeCompleto: 'Maria Operadora',
      ativo: true,
    })
    expect((putBody as Record<string, unknown>).novaSenha).toBeUndefined()
  })

  it('senha preenchida → payload COM novaSenha', async () => {
    let putBody: unknown = null
    server.use(
      http.put(`${API}/api/auth/usuarios/2`, async ({ request }) => {
        putBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(
      <EditarUsuarioDialog
        usuario={outroUsuario}
        usuarioCorrenteId={1}
        open={true}
        onOpenChange={() => {}}
      />,
      { withAuth: false },
    )

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/nova senha/i), 'novaSenha123')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(putBody).not.toBeNull())
    expect(putBody).toMatchObject({
      nomeCompleto: 'Maria Operadora',
      ativo: true,
      novaSenha: 'novaSenha123',
    })
  })

  it('mostra erro genérico em 400 (regra de negócio)', async () => {
    server.use(
      http.put(`${API}/api/auth/usuarios/2`, () =>
        HttpResponse.json(
          { erro: 'Você não pode desativar seu próprio usuário.' },
          { status: 400 },
        ),
      ),
    )

    renderWithProviders(
      <EditarUsuarioDialog
        usuario={outroUsuario}
        usuarioCorrenteId={1}
        open={true}
        onOpenChange={() => {}}
      />,
      { withAuth: false },
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/você não pode desativar seu próprio usuário/i),
      ).toBeInTheDocument()
    })
  })
})
