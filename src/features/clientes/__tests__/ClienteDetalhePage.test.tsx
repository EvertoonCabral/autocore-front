import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ClienteDetalhePage } from '../routes/ClienteDetalhePage'

const API = 'http://localhost:5206'

const cliente = {
  id: 7,
  nome: 'João Silva',
  telefone: '44999990000',
  email: 'joao@example.com',
  cpf: '12345678901',
  criadoEm: '2026-05-01T10:00:00Z',
  ativo: true,
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
    http.get(`${API}/api/clientes/7`, () => HttpResponse.json({ dados: cliente })),
    http.get(`${API}/api/auditoria/Cliente/7`, () => HttpResponse.json({ dados: [] })),
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
    http.get(`${API}/api/clientes/7`, () => HttpResponse.json({ dados: cliente })),
  )
}

beforeEach(() => server.resetHandlers())

describe('ClienteDetalhePage — gating Admin', () => {
  it('Admin enxerga o botão Desativar', async () => {
    setupAdmin()
    renderWithProviders(
      <Routes>
        <Route path="/clientes/:id" element={<ClienteDetalhePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/clientes/7'] } },
    )
    await waitFor(() => expect(screen.getByText('João Silva')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /desativar/i })).toBeInTheDocument()
  })

  it('Operador NÃO enxerga o botão Desativar', async () => {
    setupOperador()
    renderWithProviders(
      <Routes>
        <Route path="/clientes/:id" element={<ClienteDetalhePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/clientes/7'] } },
    )
    await waitFor(() => expect(screen.getByText('João Silva')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /desativar/i })).not.toBeInTheDocument()
  })
})
