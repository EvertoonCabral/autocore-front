import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { VeiculoDetalhePage } from '../routes/VeiculoDetalhePage'

const API = 'http://localhost:5206'

function meHandler() {
  return http.get(`${API}/api/auth/me`, () =>
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
  )
}

const veiculoBase = {
  id: 3,
  clienteId: 10,
  clienteNome: 'João Silva',
  placa: 'ABC1D23',
  marca: 'Fiat',
  modelo: 'Uno',
  anoFabricacao: 2018,
  anoModelo: 2019,
  cor: 'Prata',
  chassi: null,
  renavam: null,
  observacoes: null,
  ativo: true,
  ordens: [],
  criadoEm: '2026-05-01T10:00:00Z',
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/veiculos" element={<div>Lista</div>} />
      <Route path="/veiculos/:id" element={<VeiculoDetalhePage />} />
    </Routes>,
    { routerProps: { initialEntries: ['/veiculos/3'] } },
  )
}

beforeEach(() => server.resetHandlers())

describe('VeiculoDetalhePage — quilometragem atual', () => {
  it('renderiza a quilometragem atual formatada quando presente', async () => {
    server.use(
      meHandler(),
      http.get(`${API}/api/veiculos/3`, () =>
        HttpResponse.json({ dados: { ...veiculoBase, quilometragemAtual: 45000 } }),
      ),
    )
    renderPage()

    await waitFor(() => expect(screen.getByText('Quilometragem atual')).toBeInTheDocument())
    expect(screen.getByText(/45\.000\s*km/)).toBeInTheDocument()
  })

  it('renderiza "—" quando a quilometragem atual é nula', async () => {
    server.use(
      meHandler(),
      http.get(`${API}/api/veiculos/3`, () =>
        HttpResponse.json({ dados: { ...veiculoBase, quilometragemAtual: null } }),
      ),
    )
    renderPage()

    await waitFor(() => expect(screen.getByText('Quilometragem atual')).toBeInTheDocument())
    const dt = screen.getByText('Quilometragem atual')
    expect(dt.nextElementSibling?.textContent).toBe('—')
  })
})
