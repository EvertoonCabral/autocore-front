import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { FaturamentoRecebidoPage } from '../routes/FaturamentoRecebidoPage'

const API = 'http://localhost:5206'

function mockMe(user: Record<string, unknown>) {
  server.use(http.get(`${API}/api/auth/me`, () => HttpResponse.json({ dados: user })))
}

const admin = {
  id: 1,
  nomeCompleto: 'Administrador',
  email: 'admin@autocore.com',
  role: 'Admin',
  ativo: true,
}

const faturamento = {
  de: '2026-07-01',
  ate: '2026-07-31',
  total: 1500.5,
  porDia: [
    { dia: '2026-07-10', total: 500.5 },
    { dia: '2026-07-20', total: 1000 },
  ],
  porForma: [
    { forma: 2, formaLabel: 'Pix', total: 1200, quantidade: 3 },
    { forma: 1, formaLabel: 'Dinheiro', total: 300.5, quantidade: 2 },
  ],
}

describe('<FaturamentoRecebidoPage>', () => {
  it('renderiza o total e a tabela por forma a partir do envelope { dados }', async () => {
    mockMe(admin)
    server.use(
      http.get(`${API}/api/relatorios/faturamento-recebido`, () =>
        HttpResponse.json({ dados: faturamento }),
      ),
    )

    renderWithProviders(<FaturamentoRecebidoPage />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /faturamento recebido/i })).toBeInTheDocument(),
    )
    // Total 1.500,50 aparece (KPI + centro do donut)
    await waitFor(() =>
      expect(screen.getAllByText(/R\$\s*1\.500,50/).length).toBeGreaterThan(0),
    )
    // Formas aparecem (legenda do donut + tabela)
    expect(screen.getAllByText('Pix').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Dinheiro').length).toBeGreaterThan(0)
  })

  it('redireciona operador sem a flag podeVerRelatorios', async () => {
    mockMe({
      id: 5,
      nomeCompleto: 'Operador Sem Flag',
      email: 'op@autocore.com',
      role: 'Operador',
      ativo: true,
      podeVerRelatorios: false,
    })

    renderWithProviders(
      <Routes>
        <Route path="/relatorios/faturamento" element={<FaturamentoRecebidoPage />} />
        <Route path="/" element={<div>pagina inicial</div>} />
      </Routes>,
      { routerProps: { initialEntries: ['/relatorios/faturamento'] } },
    )

    await waitFor(() => expect(screen.getByText('pagina inicial')).toBeInTheDocument())
    expect(
      screen.queryByRole('heading', { name: /faturamento recebido/i }),
    ).not.toBeInTheDocument()
  })
})

describe('download de CSV', () => {
  const createObjectURL = vi.fn(() => 'blob:mock-url')
  const revokeObjectURL = vi.fn()
  // jsdom não implementa createObjectURL/revokeObjectURL — guardamos os
  // originais (se houver) para restaurar sem quebrar o construtor URL global.
  const originais = {
    create: URL.createObjectURL,
    revoke: URL.revokeObjectURL,
  }

  beforeEach(() => {
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
  })
  afterEach(() => {
    URL.createObjectURL = originais.create
    URL.revokeObjectURL = originais.revoke
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  it('clicar em "Baixar CSV" faz fetch e dispara o download', async () => {
    mockMe(admin)
    let csvChamado = false
    server.use(
      http.get(`${API}/api/relatorios/faturamento-recebido`, () =>
        HttpResponse.json({ dados: faturamento }),
      ),
      http.get(`${API}/api/relatorios/faturamento-recebido/csv`, () => {
        csvChamado = true
        return new HttpResponse('forma,total\nPix,1200\n', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="faturamento.csv"',
          },
        })
      }),
    )

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    renderWithProviders(<FaturamentoRecebidoPage />)

    const botao = await screen.findByRole('button', { name: /baixar csv/i })
    const user = userEvent.setup()
    await user.click(botao)

    await waitFor(() => expect(csvChamado).toBe(true))
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled())
    expect(clickSpy).toHaveBeenCalled()

    clickSpy.mockRestore()
  })
})
