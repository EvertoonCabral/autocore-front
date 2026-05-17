import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { AuditoriaTimeline } from '../components/AuditoriaTimeline'

const API = 'http://localhost:5206'

const timelineDados = [
  {
    id: 10,
    ocorridoEm: '2026-05-14T17:32:00Z',
    tipoEntidade: 'Cliente',
    entidadeId: 7,
    operacao: 'Criar',
    descricao: 'Cadastro inicial',
    usuarioId: 1,
    usuarioNome: 'Maria',
  },
  {
    id: 11,
    ocorridoEm: '2026-05-14T18:00:00Z',
    tipoEntidade: 'Cliente',
    entidadeId: 7,
    operacao: 'Atualizar',
    descricao: 'Telefone atualizado',
    usuarioId: null,
    usuarioNome: null,
  },
]

function mockTimeline() {
  server.use(
    http.get(`${API}/api/auditoria/Cliente/7`, () =>
      HttpResponse.json({ dados: timelineDados }),
    ),
  )
}

function setupAdmin() {
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
  )
  mockTimeline()
}

function setupOperadorSemFlag() {
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: 2,
          nomeCompleto: 'Operador',
          email: 'op@autocore.com',
          role: 'Operador',
          ativo: true,
          podeVerAuditoria: false,
        },
      }),
    ),
  )
}

function setupOperadorComFlag() {
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: 3,
          nomeCompleto: 'Operador Auditor',
          email: 'op2@autocore.com',
          role: 'Operador',
          ativo: true,
          podeVerAuditoria: true,
        },
      }),
    ),
  )
  mockTimeline()
}

beforeEach(() => server.resetHandlers())

describe('<AuditoriaTimeline>', () => {
  it('Admin vê a timeline com usuário e (sistema) para item sem usuário', async () => {
    setupAdmin()
    renderWithProviders(<AuditoriaTimeline tipoEntidade="Cliente" entidadeId={7} />)

    await waitFor(() => expect(screen.getByText('Maria')).toBeInTheDocument())
    expect(screen.getByText('(sistema)')).toBeInTheDocument()
    expect(screen.getByText('Cadastro inicial')).toBeInTheDocument()
    expect(screen.getByText('Telefone atualizado')).toBeInTheDocument()
  })

  it('Operador com flag vê a timeline', async () => {
    setupOperadorComFlag()
    renderWithProviders(<AuditoriaTimeline tipoEntidade="Cliente" entidadeId={7} />)
    await waitFor(() => expect(screen.getByText('Maria')).toBeInTheDocument())
  })

  it('Operador sem flag não renderiza nada (sem permissão)', async () => {
    setupOperadorSemFlag()
    const { container } = renderWithProviders(
      <AuditoriaTimeline tipoEntidade="Cliente" entidadeId={7} />,
    )
    // Aguarda o /me hidratar
    await new Promise((r) => setTimeout(r, 50))
    expect(container.textContent).toBe('')
    expect(screen.queryByText('Maria')).not.toBeInTheDocument()
  })
})
