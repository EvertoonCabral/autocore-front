import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ServicoDetalhePage } from '../routes/ServicoDetalhePage'

const API = 'http://localhost:5206'

const servico = {
  id: 7,
  nome: 'Troca de bateria',
  descricao: 'Inclui teste de carga',
  preco: 120,
  ehMaoDeObraPadrao: false,
  ativo: true,
  criadoEm: '2026-05-01T10:00:00Z',
  criadoPorUsuarioId: 1,
  criadoPorUsuarioNome: 'Administrador',
  atualizadoEm: '2026-05-10T14:30:00Z',
  atualizadoPorUsuarioId: 1,
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
    http.get(`${API}/api/servicos/7`, () => HttpResponse.json({ dados: servico })),
    http.get(`${API}/api/auditoria/CatalogoServico/7`, () => HttpResponse.json({ dados: [] })),
  )
}

function setupOperador() {
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
    http.get(`${API}/api/servicos/7`, () => HttpResponse.json({ dados: servico })),
  )
}

beforeEach(() => server.resetHandlers())

describe('ServicoDetalhePage', () => {
  it('Admin vê dados + botões Alterar preço, Editar e Desativar', async () => {
    setupAdmin()
    renderWithProviders(
      <Routes>
        <Route path="/servicos/:id" element={<ServicoDetalhePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos/7'] } },
    )
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Troca de bateria' })).toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: /alterar preço/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /desativar/i })).toBeInTheDocument()
    expect(screen.getByText(/Criado em/)).toBeInTheDocument()
    expect(screen.getByText('Histórico de alterações')).toBeInTheDocument()
  })

  it('Operador vê dados + Editar; não vê Alterar preço nem Desativar', async () => {
    setupOperador()
    renderWithProviders(
      <Routes>
        <Route path="/servicos/:id" element={<ServicoDetalhePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos/7'] } },
    )
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Troca de bateria' })).toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: /editar/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /alterar preço/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /desativar/i })).not.toBeInTheDocument()
    // AuditoriaInfo sempre presente; Timeline gated
    expect(screen.getByText(/Criado em/)).toBeInTheDocument()
    expect(screen.queryByText('Histórico de alterações')).not.toBeInTheDocument()
  })
})
