import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { RankingClientesPage } from '../routes/RankingClientesPage'

const API = 'http://localhost:5206'

const admin = {
  id: 1,
  nomeCompleto: 'Administrador',
  email: 'admin@autocore.com',
  role: 'Admin',
  ativo: true,
}

const ranking = {
  dados: [
    { clienteId: 1, clienteNome: 'Oficina do João', qtdOs: 5, totalFaturado: 3200 },
    { clienteId: 2, clienteNome: 'Maria Transportes', qtdOs: 3, totalFaturado: 1800 },
  ],
  total: 2,
  pagina: 1,
  porPagina: 20,
  totalFaturadoGeral: 5000,
  totalOs: 8,
  ticketMedio: 625,
}

describe('<RankingClientesPage>', () => {
  it('renderiza a tabela e os totais gerais de dentro do objeto de resposta', async () => {
    server.use(
      http.get(`${API}/api/auth/me`, () => HttpResponse.json({ dados: admin })),
      http.get(`${API}/api/relatorios/clientes`, () =>
        HttpResponse.json({ dados: ranking }),
      ),
    )

    renderWithProviders(<RankingClientesPage />)

    await waitFor(() =>
      expect(screen.getByText('Oficina do João')).toBeInTheDocument(),
    )
    expect(screen.getByText('Maria Transportes')).toBeInTheDocument()

    // Totais gerais (KPIs) — total faturado geral e ticket médio
    expect(screen.getByText(/R\$\s*5\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*625,00/)).toBeInTheDocument()
    // Total de OSs
    expect(screen.getByText('8')).toBeInTheDocument()
  })
})
