import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ResumoFinanceiroPage } from '../routes/ResumoFinanceiroPage'

const API = 'http://localhost:5206'

const admin = {
  id: 1,
  nomeCompleto: 'Administrador',
  email: 'admin@autocore.com',
  role: 'Admin',
  ativo: true,
}

const resumo = {
  de: '2026-07-01',
  ate: '2026-07-31',
  recebido: 4321.99,
  faturado: 8000,
  aReceber: 3678.01,
  aging: [
    { faixa: '0-30 dias', total: 1000, quantidade: 2 },
    { faixa: '31-60 dias', total: 2678.01, quantidade: 3 },
  ],
}

describe('<ResumoFinanceiroPage>', () => {
  it('renderiza os KPIs e o aging a partir do envelope { dados }', async () => {
    server.use(
      http.get(`${API}/api/auth/me`, () => HttpResponse.json({ dados: admin })),
      http.get(`${API}/api/relatorios/resumo-financeiro`, () =>
        HttpResponse.json({ dados: resumo }),
      ),
    )

    renderWithProviders(<ResumoFinanceiroPage />)

    await waitFor(() =>
      expect(screen.getByText(/R\$\s*4\.321,99/)).toBeInTheDocument(),
    )
    expect(screen.getByText(/R\$\s*8\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*3\.678,01/)).toBeInTheDocument()

    // Faixas de aging
    expect(screen.getByText('0-30 dias')).toBeInTheDocument()
    expect(screen.getByText('31-60 dias')).toBeInTheDocument()
  })
})
