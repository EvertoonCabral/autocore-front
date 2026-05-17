import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { AcessoAuditoriaTab } from '../components/AcessoAuditoriaTab'

const API = 'http://localhost:5206'

const usuariosBase = [
  // O próprio Admin logado — deve ser filtrado
  {
    id: 1,
    nomeCompleto: 'Administrador',
    email: 'admin@autocore.com',
    role: 'Admin',
    ativo: true,
    podeVerAuditoria: true,
  },
  // Outro Admin — também filtrado
  {
    id: 2,
    nomeCompleto: 'Outro Admin',
    email: 'admin2@autocore.com',
    role: 'Admin',
    ativo: true,
    podeVerAuditoria: true,
  },
  // Operadores — entram na lista
  {
    id: 3,
    nomeCompleto: 'Maria Operadora',
    email: 'maria@autocore.com',
    role: 'Operador',
    ativo: true,
    podeVerAuditoria: false,
  },
  {
    id: 4,
    nomeCompleto: 'João Operador',
    email: 'joao@autocore.com',
    role: 'Operador',
    ativo: true,
    podeVerAuditoria: true,
  },
]

function setupBase(usuarios = usuariosBase) {
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: 1,
          nomeCompleto: 'Administrador',
          email: 'admin@autocore.com',
          role: 'Admin',
          ativo: true,
          podeVerAuditoria: true,
        },
      }),
    ),
    http.get(`${API}/api/auth/usuarios`, () => HttpResponse.json({ dados: usuarios })),
  )
}

beforeEach(() => server.resetHandlers())

describe('<AcessoAuditoriaTab>', () => {
  it('lista apenas operadores (esconde Admins e o próprio usuário)', async () => {
    setupBase()
    renderWithProviders(<AcessoAuditoriaTab />)

    await waitFor(() =>
      expect(screen.getByText('Maria Operadora')).toBeInTheDocument(),
    )
    expect(screen.getByText('João Operador')).toBeInTheDocument()
    expect(screen.queryByText('Administrador')).not.toBeInTheDocument()
    expect(screen.queryByText('Outro Admin')).not.toBeInTheDocument()
  })

  it('mostra empty state quando não há operadores', async () => {
    setupBase([usuariosBase[0]!, usuariosBase[1]!]) // só os admins
    renderWithProviders(<AcessoAuditoriaTab />)

    await waitFor(() =>
      expect(screen.getByText(/nenhum operador cadastrado/i)).toBeInTheDocument(),
    )
  })

  it('toggle dispara PUT e mantém estado ao ter sucesso', async () => {
    setupBase()
    let putCalled = false
    // Após o PUT bem-sucedido, o refetch do GET deve devolver a Maria com flag=true
    const usuariosAtualizados = usuariosBase.map((u) =>
      u.id === 3 ? { ...u, podeVerAuditoria: true } : u,
    )
    server.use(
      http.put(`${API}/api/auth/usuarios/3/permissao-auditoria`, async ({ request }) => {
        putCalled = true
        const body = (await request.json()) as { podeVerAuditoria: boolean }
        expect(body.podeVerAuditoria).toBe(true)
        // Substitui o handler do GET para devolver a versão atualizada
        server.use(
          http.get(`${API}/api/auth/usuarios`, () =>
            HttpResponse.json({ dados: usuariosAtualizados }),
          ),
        )
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<AcessoAuditoriaTab />)

    const switchEl = await screen.findByRole('switch', {
      name: /permitir auditoria para maria operadora/i,
    })
    expect(switchEl).toHaveAttribute('aria-checked', 'false')

    const user = userEvent.setup()
    await user.click(switchEl)

    await waitFor(() => expect(putCalled).toBe(true))
    // Após sucesso e refetch, o switch permanece em true
    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: /permitir auditoria para maria operadora/i }),
      ).toHaveAttribute('aria-checked', 'true'),
    )
  })

  it('toggle faz rollback em erro do back', async () => {
    setupBase()
    server.use(
      http.put(`${API}/api/auth/usuarios/3/permissao-auditoria`, () =>
        HttpResponse.json({ erro: 'Erro' }, { status: 500 }),
      ),
      // refetch após erro deve devolver lista original (Maria com flag=false)
      http.get(`${API}/api/auth/usuarios`, () => HttpResponse.json({ dados: usuariosBase })),
    )

    renderWithProviders(<AcessoAuditoriaTab />)

    const switchEl = await screen.findByRole('switch', {
      name: /permitir auditoria para maria operadora/i,
    })
    expect(switchEl).toHaveAttribute('aria-checked', 'false')

    const user = userEvent.setup()
    await user.click(switchEl)

    // Rollback: volta para false
    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: /permitir auditoria para maria operadora/i }),
      ).toHaveAttribute('aria-checked', 'false'),
    )
  })
})
