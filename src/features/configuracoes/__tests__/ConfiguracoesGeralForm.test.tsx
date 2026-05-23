import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ConfiguracoesGeralForm } from '../components/ConfiguracoesGeralForm'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

describe('<ConfiguracoesGeralForm> — AuditoriaInfo consolidada', () => {
  it('exibe quem alterou por último entre as 3 chaves visíveis', async () => {
    server.use(
      http.get(`${API}/api/configuracoes`, () =>
        HttpResponse.json({
          dados: [
            {
              chave: 'DiasParaCobranca',
              valor: '5',
              criadoEm: '2026-01-01T10:00:00Z',
              criadoPorUsuarioNome: 'Sistema',
              atualizadoEm: '2026-02-01T10:00:00Z',
              atualizadoPorUsuarioNome: 'João',
            },
            {
              chave: 'MensagemCobranca',
              valor: 'Olá {Cliente}',
              criadoEm: '2026-01-01T10:00:00Z',
              criadoPorUsuarioNome: 'Sistema',
              // mais recente — deve aparecer como "última alteração"
              atualizadoEm: '2026-05-15T10:00:00Z',
              atualizadoPorUsuarioNome: 'Maria',
            },
            {
              chave: 'PrecosAtualizadosEm',
              valor: '',
              criadoEm: '2026-01-01T10:00:00Z',
              criadoPorUsuarioNome: 'Sistema',
              atualizadoEm: '2026-03-01T10:00:00Z',
              atualizadoPorUsuarioNome: 'Pedro',
            },
          ],
        }),
      ),
    )

    renderWithProviders(<ConfiguracoesGeralForm />, { withAuth: false })

    // AuditoriaInfo mostra "Atualizado em ... por Maria" (a mais recente)
    await waitFor(() =>
      expect(screen.getByText(/Maria/)).toBeInTheDocument(),
    )
    // Não exibe os outros usuários no bloco de auditoria (sem timeline aqui)
    expect(screen.queryByText('João')).not.toBeInTheDocument()
    expect(screen.queryByText('Pedro')).not.toBeInTheDocument()
  })

  it('não renderiza AuditoriaInfo quando não há configurações', async () => {
    server.use(
      http.get(`${API}/api/configuracoes`, () => HttpResponse.json({ dados: [] })),
    )

    renderWithProviders(<ConfiguracoesGeralForm />, { withAuth: false })

    // form ainda aparece, mas sem bloco de auditoria
    await waitFor(() =>
      expect(screen.getByLabelText(/Dias para cobrança/i)).toBeInTheDocument(),
    )
    expect(screen.queryByText(/Atualizado em/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Criado em/i)).not.toBeInTheDocument()
  })
})
