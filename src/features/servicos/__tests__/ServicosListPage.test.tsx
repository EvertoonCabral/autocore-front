import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ServicosListPage } from '../routes/ServicosListPage'

const API = 'http://localhost:5206'

const servicos = [
  {
    id: 1,
    nome: 'Troca de bateria',
    descricao: 'Inclui teste',
    preco: 120,
    ehMaoDeObraPadrao: false,
    ativo: true,
  },
  {
    id: 2,
    nome: 'Diagnóstico elétrico',
    descricao: 'Padrão da casa',
    preco: 80,
    ehMaoDeObraPadrao: true,
    ativo: true,
  },
]

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
    http.get(`${API}/api/servicos`, () => HttpResponse.json({ dados: servicos })),
  )
}

beforeEach(() => server.resetHandlers())

describe('ServicosListPage', () => {
  it('renderiza a lista com badge Padrão e link Novo serviço', async () => {
    setupAdmin()
    renderWithProviders(
      <Routes>
        <Route path="/servicos" element={<ServicosListPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos'] } },
    )
    await waitFor(() =>
      expect(screen.getByText('Troca de bateria')).toBeInTheDocument(),
    )
    expect(screen.getByText('Diagnóstico elétrico')).toBeInTheDocument()
    expect(screen.getByText('Padrão')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /novo serviço/i })).toHaveAttribute(
      'href',
      '/servicos/novo',
    )
    // Sem dialogs antigos: nenhum botão de Editar inline na linha.
    expect(screen.queryByRole('button', { name: /^editar/i })).not.toBeInTheDocument()
  })

  it('linha clicável navega para /servicos/:id', async () => {
    setupAdmin()
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/servicos" element={<ServicosListPage />} />
        <Route path="/servicos/:id" element={<div>Stub detalhe {window.location.pathname}</div>} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos'] } },
    )
    await waitFor(() =>
      expect(screen.getByText('Troca de bateria')).toBeInTheDocument(),
    )
    await user.click(screen.getByText('Troca de bateria'))
    await waitFor(() => expect(screen.getByText(/Stub detalhe/)).toBeInTheDocument())
  })
})
