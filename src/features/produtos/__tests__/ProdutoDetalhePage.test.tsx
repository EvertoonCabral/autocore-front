import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ProdutoDetalhePage } from '../routes/ProdutoDetalhePage'

const API = 'http://localhost:5206'

const produto = {
  id: 12,
  nome: 'Bateria Moura 60Ah',
  referencia: 'M60GD',
  precoCusto: 380,
  precoVenda: 520,
  quantidadeEstoque: 5,
  estoqueMinimo: 2,
  ativo: true,
  criadoEm: '2026-05-01T10:00:00Z',
  criadoPorUsuarioId: 99,
  criadoPorUsuarioNome: 'Administrador',
  atualizadoEm: '2026-05-10T14:30:00Z',
  atualizadoPorUsuarioId: 99,
  atualizadoPorUsuarioNome: 'Administrador',
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
    http.get(`${API}/api/produtos/12`, () => HttpResponse.json({ dados: produto })),
    http.get(`${API}/api/auditoria/Produto/12`, () => HttpResponse.json({ dados: [] })),
  )
}

function setupOperadorComAuditoria() {
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: 2,
          nomeCompleto: 'Operador Auditor',
          email: 'op@autocore.com',
          role: 'Operador',
          ativo: true,
          podeVerAuditoria: true,
        },
      }),
    ),
    http.get(`${API}/api/produtos/12`, () => HttpResponse.json({ dados: produto })),
    http.get(`${API}/api/auditoria/Produto/12`, () => HttpResponse.json({ dados: [] })),
  )
}

function setupOperadorSemAuditoria() {
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: 3,
          nomeCompleto: 'Operador',
          email: 'op2@autocore.com',
          role: 'Operador',
          ativo: true,
          podeVerAuditoria: false,
        },
      }),
    ),
    http.get(`${API}/api/produtos/12`, () => HttpResponse.json({ dados: produto })),
  )
}

beforeEach(() => server.resetHandlers())

describe('ProdutoDetalhePage — auditoria', () => {
  it('Admin enxerga AuditoriaInfo e seção "Histórico de alterações"', async () => {
    setupAdmin()
    renderWithProviders(
      <Routes>
        <Route path="/produtos/:id" element={<ProdutoDetalhePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/produtos/12'] } },
    )
    await waitFor(() =>
      expect(screen.getByText('Bateria Moura 60Ah')).toBeInTheDocument(),
    )
    expect(screen.getByText(/Criado em/)).toBeInTheDocument()
    expect(screen.getByText('Histórico de alterações')).toBeInTheDocument()
  })

  it('Operador com podeVerAuditoria enxerga a seção timeline', async () => {
    setupOperadorComAuditoria()
    renderWithProviders(
      <Routes>
        <Route path="/produtos/:id" element={<ProdutoDetalhePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/produtos/12'] } },
    )
    await waitFor(() =>
      expect(screen.getByText('Bateria Moura 60Ah')).toBeInTheDocument(),
    )
    expect(screen.getByText('Histórico de alterações')).toBeInTheDocument()
  })

  it('Operador sem podeVerAuditoria NÃO vê a seção timeline (mas vê AuditoriaInfo)', async () => {
    setupOperadorSemAuditoria()
    renderWithProviders(
      <Routes>
        <Route path="/produtos/:id" element={<ProdutoDetalhePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/produtos/12'] } },
    )
    await waitFor(() =>
      expect(screen.getByText('Bateria Moura 60Ah')).toBeInTheDocument(),
    )
    expect(screen.getByText(/Criado em/)).toBeInTheDocument()
    expect(screen.queryByText('Histórico de alterações')).not.toBeInTheDocument()
  })
})
