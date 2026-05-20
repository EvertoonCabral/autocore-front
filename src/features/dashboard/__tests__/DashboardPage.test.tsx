import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { DashboardPage } from '../routes/DashboardPage'

const API = 'http://localhost:5206'

interface DashboardResumoMock {
  contagensOs: { abertas: number; emAndamento: number; aguardandoProduto: number }
  pendencias: { vencidasCount: number; vencidasValorTotal: number }
  estoque: { produtosAbaixoMinimo: number }
  faturamento: { mes: number; ano: number; total: number }
  ultimasOrdens: Array<{
    id: number
    numero: string
    clienteId: number
    clienteNome: string
    status: number
    abertaEm: string
    fechadaEm: string | null
    dataVencimentoPagamento: string | null
    totalGeral: number
    saldoDevedor: number
  }>
  pendenciasMaisAntigas: Array<{
    ordemServicoId: number
    numero: string
    clienteId: number
    clienteNome: string
    clienteTelefone: string
    fechadaEm: string | null
    dataVencimentoPagamento: string | null
    totalGeral: number
    totalPago: number
    saldoDevedor: number
    vencida: boolean
  }>
}

function mockResumo(resumo: DashboardResumoMock) {
  server.use(
    http.get(`${API}/api/dashboard/resumo`, () =>
      HttpResponse.json({ dados: resumo }),
    ),
    http.get(`${API}/api/dashboard/faturamento`, () =>
      HttpResponse.json({ dados: [] }),
    ),
  )
}

function mockResumoError() {
  server.use(
    http.get(`${API}/api/dashboard/resumo`, () =>
      HttpResponse.json({ erro: 'Falha' }, { status: 500 }),
    ),
    http.get(`${API}/api/dashboard/faturamento`, () =>
      HttpResponse.json({ dados: [] }),
    ),
  )
}

const resumoCompleto: DashboardResumoMock = {
  contagensOs: { abertas: 4, emAndamento: 2, aguardandoProduto: 1 },
  pendencias: { vencidasCount: 3, vencidasValorTotal: 1250.5 },
  estoque: { produtosAbaixoMinimo: 2 },
  faturamento: { mes: 5, ano: 2026, total: 4321.99 },
  ultimasOrdens: [
    {
      id: 10,
      numero: 'OS-2026-0010',
      clienteId: 1,
      clienteNome: 'Cliente A',
      status: 1,
      abertaEm: '2026-05-15T10:00:00Z',
      fechadaEm: null,
      dataVencimentoPagamento: null,
      totalGeral: 250,
      saldoDevedor: 250,
    },
    {
      id: 11,
      numero: 'OS-2026-0011',
      clienteId: 2,
      clienteNome: 'Cliente B',
      status: 2,
      abertaEm: '2026-05-14T10:00:00Z',
      fechadaEm: null,
      dataVencimentoPagamento: null,
      totalGeral: 480,
      saldoDevedor: 480,
    },
  ],
  pendenciasMaisAntigas: [
    {
      ordemServicoId: 50,
      numero: 'OS-2026-0050',
      clienteId: 1,
      clienteNome: 'Cliente A',
      clienteTelefone: '5544999990000',
      fechadaEm: '2026-04-01T10:00:00Z',
      dataVencimentoPagamento: '2026-04-08T10:00:00Z',
      totalGeral: 300,
      totalPago: 100,
      saldoDevedor: 200,
      vencida: true,
    },
  ],
}

describe('<DashboardPage>', () => {
  it('renderiza skeletons enquanto carrega', () => {
    server.use(
      http.get(`${API}/api/dashboard/resumo`, async () => {
        // promessa nunca resolve no escopo deste teste — força estado loading
        await new Promise(() => {})
        return HttpResponse.json({ dados: resumoCompleto })
      }),
      http.get(`${API}/api/dashboard/faturamento`, () =>
        HttpResponse.json({ dados: [] }),
      ),
    )

    const { container } = renderWithProviders(<DashboardPage />)

    // título sempre aparece, dados ainda não
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renderiza KPIs e listas com sucesso', async () => {
    mockResumo(resumoCompleto)

    renderWithProviders(<DashboardPage />)

    // Espera o faturamento do mês aparecer (sinaliza que o fetch concluiu)
    await waitFor(() =>
      expect(screen.getByText(/R\$\s*4\.321,99/)).toBeInTheDocument(),
    )

    // Todos os 6 KPIs renderizados (alguns labels podem aparecer também
    // como texto do badge da OS — usar getAllByText nesses casos).
    expect(screen.getByText('OS abertas')).toBeInTheDocument()
    expect(screen.getAllByText('Em andamento').length).toBeGreaterThan(0)
    expect(screen.getByText('Aguardando produto')).toBeInTheDocument()
    expect(screen.getByText('Pendências vencidas')).toBeInTheDocument()
    expect(screen.getByText('Estoque crítico')).toBeInTheDocument()
    expect(screen.getByText(/Faturamento de maio/i)).toBeInTheDocument()

    // Valor 4 (abertas) deve aparecer ao menos uma vez
    expect(screen.getAllByText('4').length).toBeGreaterThan(0)
    // Valor 3 (pendências vencidas count)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)

    // Última OS aparece
    expect(screen.getByText('OS-2026-0010')).toBeInTheDocument()
    expect(screen.getAllByText('Cliente A').length).toBeGreaterThan(0)
    expect(screen.getByText('OS-2026-0011')).toBeInTheDocument()

    // Pendência aparece com badge "Vencida"
    expect(screen.getByText('OS-2026-0050')).toBeInTheDocument()
    expect(screen.getByText('Vencida')).toBeInTheDocument()

    // Link da última OS aponta para /ordens/10
    const link = screen.getByText('OS-2026-0010').closest('a')
    expect(link).toHaveAttribute('href', '/ordens/10')
  })

  it('mostra mensagem de erro quando a request falha', async () => {
    mockResumoError()

    renderWithProviders(<DashboardPage />)

    await waitFor(() =>
      expect(
        screen.getByText(/não foi possível carregar o painel/i),
      ).toBeInTheDocument(),
    )
  })

  it('renderiza os 3 novos componentes de gráfico no DOM', async () => {
    mockResumo({
      ...resumoCompleto,
      // adiciona distribuicoes via spread — campo opcional do back
    } as DashboardResumoMock & {
      distribuicoes: {
        pagamentosMes: Array<{ forma: number; formaLabel: string; valor: number; quantidade: number }>
        statusOsAbertas: Array<{ status: number; statusLabel: string; quantidade: number }>
      }
    })

    renderWithProviders(<DashboardPage />)

    // Faturamento (header)
    await waitFor(() =>
      expect(screen.getByText(/^Faturamento$/i)).toBeInTheDocument(),
    )
    // Donut de formas de pagamento
    expect(screen.getByText(/formas de pagamento/i)).toBeInTheDocument()
    // Donut de status
    expect(screen.getByText(/status das oss em aberto/i)).toBeInTheDocument()
  })

  it('mostra estado vazio em listas quando arrays vazios', async () => {
    mockResumo({
      contagensOs: { abertas: 0, emAndamento: 0, aguardandoProduto: 0 },
      pendencias: { vencidasCount: 0, vencidasValorTotal: 0 },
      estoque: { produtosAbaixoMinimo: 0 },
      faturamento: { mes: 5, ano: 2026, total: 0 },
      ultimasOrdens: [],
      pendenciasMaisAntigas: [],
    })

    renderWithProviders(<DashboardPage />)

    await waitFor(() =>
      expect(screen.getByText(/nenhuma os aberta ainda/i)).toBeInTheDocument(),
    )
    expect(screen.getByText(/nenhuma pendência em aberto/i)).toBeInTheDocument()
  })
})
