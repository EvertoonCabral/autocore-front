import { describe, expect, it, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { StatusPagamentoCard } from '../components/StatusPagamentoCard'

const API = 'http://localhost:5206'

function mockStatus(dados: Record<string, unknown>) {
  server.use(
    http.get(`${API}/api/configuracoes/pagamento/status`, () => HttpResponse.json({ dados })),
  )
}

beforeEach(() => server.resetHandlers())

describe('<StatusPagamentoCard>', () => {
  it('mostra dica inicial antes de testar (query sob demanda)', () => {
    renderWithProviders(<StatusPagamentoCard />, { withAuth: false })
    expect(screen.getByRole('button', { name: /testar credenciais/i })).toBeInTheDocument()
    expect(screen.getByText(/para validar o access token/i)).toBeInTheDocument()
  })

  it('mostra "Credenciais OK" e o apelido após testar com sucesso', async () => {
    mockStatus({
      valido: true,
      apelido: 'OFICINA_MP',
      modo: 'producao',
      consultadoEm: '2026-08-10T10:00:00Z',
    })

    renderWithProviders(<StatusPagamentoCard />, { withAuth: false })
    await userEvent.click(screen.getByRole('button', { name: /testar credenciais/i }))

    await waitFor(() => expect(screen.getByText('Credenciais OK')).toBeInTheDocument())
    expect(screen.getByText(/OFICINA_MP/)).toBeInTheDocument()
  })

  it('mostra "Modo stub" quando o back responde modo=stub', async () => {
    mockStatus({
      valido: true,
      apelido: 'STUB',
      modo: 'stub',
      erroMensagem: 'Modo stub ativo — Mercado Pago não consultado.',
      consultadoEm: '2026-08-10T10:00:00Z',
    })

    renderWithProviders(<StatusPagamentoCard />, { withAuth: false })
    await userEvent.click(screen.getByRole('button', { name: /testar credenciais/i }))

    await waitFor(() => expect(screen.getByText('Modo stub')).toBeInTheDocument())
  })

  it('mostra "Credenciais inválidas" e o erro quando valido=false', async () => {
    mockStatus({
      valido: false,
      modo: 'sandbox',
      erroMensagem: 'Status 401: invalid access token',
      consultadoEm: '2026-08-10T10:00:00Z',
    })

    renderWithProviders(<StatusPagamentoCard />, { withAuth: false })
    await userEvent.click(screen.getByRole('button', { name: /testar credenciais/i }))

    await waitFor(() => expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument())
    expect(screen.getByText(/invalid access token/i)).toBeInTheDocument()
  })
})
