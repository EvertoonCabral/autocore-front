import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { StatusConexaoCard } from '../components/StatusConexaoCard'

const API = 'http://localhost:5206'

function mockStatus(dados: Record<string, unknown>) {
  server.use(
    http.get(`${API}/api/configuracoes/cobranca/status`, () =>
      HttpResponse.json({ dados }),
    ),
  )
}

beforeEach(() => server.resetHandlers())

describe('<StatusConexaoCard>', () => {
  it('renderiza badge "Conectado" quando conectado=true', async () => {
    mockStatus({
      conectado: true,
      numero: '5544999990000',
      estadoBruto: 'open',
      consultadoEm: '2026-05-17T10:00:00Z',
    })

    renderWithProviders(<StatusConexaoCard />, { withAuth: false })

    await waitFor(() => expect(screen.getByText('Conectado')).toBeInTheDocument())
    expect(screen.getByText(/\(44\) 99999-0000/)).toBeInTheDocument()
  })

  it('renderiza badge "Modo stub" quando estadoBruto=stub', async () => {
    mockStatus({
      conectado: false,
      estadoBruto: 'stub',
      erroMensagem: 'Modo stub ativo — Evolution não consultada',
      consultadoEm: '2026-05-17T10:00:00Z',
    })

    renderWithProviders(<StatusConexaoCard />, { withAuth: false })

    await waitFor(() => expect(screen.getByText('Modo stub')).toBeInTheDocument())
    expect(
      screen.getByText(/modo stub ativo — evolution não consultada/i),
    ).toBeInTheDocument()
  })

  it('renderiza badge "Desconectado" quando conectado=false (sem stub)', async () => {
    mockStatus({
      conectado: false,
      estadoBruto: 'close',
      consultadoEm: '2026-05-17T10:00:00Z',
    })

    renderWithProviders(<StatusConexaoCard />, { withAuth: false })

    await waitFor(() => expect(screen.getByText('Desconectado')).toBeInTheDocument())
  })

  it('renderiza mensagem de erro em bloco vermelho quando erroMensagem está presente', async () => {
    mockStatus({
      conectado: false,
      estadoBruto: 'close',
      erroMensagem: 'Falha de rede ao consultar Evolution.',
      consultadoEm: '2026-05-17T10:00:00Z',
    })

    renderWithProviders(<StatusConexaoCard />, { withAuth: false })

    await waitFor(() =>
      expect(
        screen.getByText(/falha de rede ao consultar evolution/i),
      ).toBeInTheDocument(),
    )
  })
})
