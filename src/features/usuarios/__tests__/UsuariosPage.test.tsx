import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { RequireAuth } from '@/shared/guards/RequireAuth'
import { UsuariosPage } from '../routes/UsuariosPage'

const API = 'http://localhost:5206'

const usuarios = [
  {
    id: 1,
    nomeCompleto: 'Administrador',
    email: 'admin@autocore.com',
    role: 'Admin',
    ativo: true,
    podeVerAuditoria: true,
  },
  {
    id: 2,
    nomeCompleto: 'Maria Operadora',
    email: 'maria@autocore.com',
    role: 'Operador',
    ativo: true,
    podeVerAuditoria: false,
  },
  {
    id: 3,
    nomeCompleto: 'João Antigo',
    email: 'joao@autocore.com',
    role: 'Operador',
    ativo: false,
    podeVerAuditoria: false,
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
    http.get(`${API}/api/auth/usuarios`, () => HttpResponse.json({ dados: usuarios })),
  )
}

function setupOperador() {
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: 2,
          nomeCompleto: 'Maria Operadora',
          email: 'maria@autocore.com',
          role: 'Operador',
          ativo: true,
          podeVerAuditoria: false,
        },
      }),
    ),
    http.get(`${API}/api/auth/usuarios`, () => HttpResponse.json({ dados: usuarios })),
  )
}

beforeEach(() => server.resetHandlers())

describe('<UsuariosPage>', () => {
  it('Admin vê a lista (esconde inativos por default)', async () => {
    setupAdmin()
    renderWithProviders(
      <Routes>
        <Route
          path="/usuarios"
          element={
            <RequireAuth>
              <UsuariosPage />
            </RequireAuth>
          }
        />
        <Route path="/" element={<div>Dashboard fake</div>} />
      </Routes>,
      { routerProps: { initialEntries: ['/usuarios'] } },
    )

    await waitFor(() => {
      expect(screen.getByText('Administrador')).toBeInTheDocument()
    })
    expect(screen.getByText('Maria Operadora')).toBeInTheDocument()
    // Inativo escondido por default
    expect(screen.queryByText('João Antigo')).not.toBeInTheDocument()

    // Botão "+ Novo usuário"
    expect(screen.getByRole('button', { name: /novo usuário/i })).toBeInTheDocument()
  })

  it('Operador é redirecionado pelo RequireRole', async () => {
    setupOperador()
    renderWithProviders(
      <Routes>
        <Route
          path="/usuarios"
          element={
            <RequireAuth>
              <UsuariosPage />
            </RequireAuth>
          }
        />
        <Route path="/" element={<div>Dashboard fake</div>} />
      </Routes>,
      { routerProps: { initialEntries: ['/usuarios'] } },
    )

    await waitFor(() => {
      expect(screen.getByText('Dashboard fake')).toBeInTheDocument()
    })
    // Não deve mostrar a lista
    expect(screen.queryByText('Maria Operadora')).not.toBeInTheDocument()
  })
})
