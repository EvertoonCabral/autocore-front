import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor, within } from '@/test/render'
import { server } from '@/test/msw/server'
import { DashboardPage } from '../routes/DashboardPage'
import type { DashboardResumoDto } from '@/api/types'

const API = 'http://localhost:5206'

const resumoCompleto: DashboardResumoDto = {
  fluxo: {
    aberta: { status: 1, statusLabel: 'Aberta', quantidade: 4, maisAntigaDias: 5 },
    emAndamento: { status: 2, statusLabel: 'Em andamento', quantidade: 2, maisAntigaDias: 1 },
    aguardandoProduto: {
      status: 3,
      statusLabel: 'Aguardando produto',
      quantidade: 0,
      maisAntigaDias: null,
    },
    concluida: { quantidade: 7, naoPagas: 3 },
  },
  caixa: {
    mes: 8,
    ano: 2026,
    recebidoMes: 4321.99,
    recebidoMesAnterior: 3000,
    aReceberVencido: 200,
    aReceberAVencer: 800,
    ticketMedio6m: 450,
    estoqueAbaixoMinimo: 2,
  },
  precisaAtencao: [
    {
      ordemServicoId: 50,
      numero: 'OS-2026-0050',
      clienteId: 1,
      clienteNome: 'Cliente A',
      clienteTelefone: '5544999990000',
      fechadaEm: '2026-07-01T10:00:00Z',
      dataVencimentoPagamento: '2026-07-08T10:00:00Z',
      totalGeral: 300,
      totalPago: 100,
      saldoDevedor: 200,
      vencida: true,
    },
  ],
}

function mockDashboard(resumo: DashboardResumoDto) {
  server.use(
    http.get(`${API}/api/dashboard/resumo`, () => HttpResponse.json({ dados: resumo })),
    http.get(`${API}/api/dashboard/faturamento`, () => HttpResponse.json({ dados: [] })),
  )
}

describe('<DashboardPage>', () => {
  it('renderiza o cabeçalho e as ações de topo', async () => {
    mockDashboard(resumoCompleto)
    renderWithProviders(<DashboardPage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/bem-vindo/i)
    expect(screen.getByRole('link', { name: /novo cliente/i })).toHaveAttribute(
      'href',
      '/clientes/novo',
    )
    expect(screen.getByRole('link', { name: /nova os/i })).toHaveAttribute('href', '/ordens/nova')
  })

  it('renderiza a faixa de fluxo com números e legendas contextuais', async () => {
    mockDashboard(resumoCompleto)
    renderWithProviders(<DashboardPage />)

    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument())

    // Escopa na faixa de fluxo — o número "2" também aparece no Caixa (estoque)
    const fluxo = within(screen.getByRole('group', { name: /fluxo de ordens/i }))

    // Números das etapas
    expect(fluxo.getByText('4')).toBeInTheDocument()
    expect(fluxo.getByText('2')).toBeInTheDocument()

    // 0 renderiza com tom "disabled" (ausência não compete com trabalho real)
    const zero = fluxo.getByText('0')
    expect(zero).toBeInTheDocument()
    expect(zero.className).toContain('text-content-disabled')

    // Legendas contextuais (não repetem o número)
    expect(screen.getByText('mais antiga há 5 dias')).toBeInTheDocument()
    expect(screen.getByText('mais antiga há 1 dia')).toBeInTheDocument()
    expect(screen.getByText('nenhum veículo na bancada')).toBeInTheDocument()
    expect(screen.getByText('3 ainda não pagas')).toBeInTheDocument()
  })

  it('renderiza os valores do Caixa via formatBRL', async () => {
    mockDashboard(resumoCompleto)
    renderWithProviders(<DashboardPage />)

    await waitFor(() => expect(screen.getByText(/R\$\s*4\.321,99/)).toBeInTheDocument())

    // Recebido no mês + comparação
    expect(screen.getByText(/mês anterior:\s*R\$\s*3\.000,00/)).toBeInTheDocument()
    // A receber (200 + 800 = 1000) e detalhamento
    expect(screen.getByText(/R\$\s*1\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/vencido\s*R\$\s*200,00/)).toBeInTheDocument()
    expect(screen.getByText(/a vencer\s*R\$\s*800,00/)).toBeInTheDocument()
    // Ticket médio + estoque abaixo do mínimo
    expect(screen.getByText(/R\$\s*450,00/)).toBeInTheDocument()
    const estoqueLink = screen.getByRole('link', { name: '2' })
    expect(estoqueLink).toHaveAttribute('href', '/produtos/abaixo-minimo')
  })

  it('renderiza as linhas de "Precisa de você hoje" com botão Cobrar', async () => {
    mockDashboard(resumoCompleto)
    renderWithProviders(<DashboardPage />)

    await waitFor(() => expect(screen.getByText('OS-2026-0050')).toBeInTheDocument())

    expect(screen.getByText('Cliente A')).toBeInTheDocument()
    expect(screen.getByText('vencida')).toBeInTheDocument()

    // A linha inteira leva ao detalhe da OS
    const linha = screen.getByText('OS-2026-0050').closest('[role="button"]')
    expect(linha).not.toBeNull()
    const naLinha = within(linha as HTMLElement)
    // O saldo (R$ 200,00) também aparece no Caixa como "vencido" — escopa na linha
    expect(naLinha.getByText(/R\$\s*200,00/)).toBeInTheDocument()
    expect(naLinha.getByRole('button', { name: /cobrar/i })).toBeInTheDocument()
  })

  it('mostra o estado vazio quando não há nada vencido', async () => {
    mockDashboard({ ...resumoCompleto, precisaAtencao: [] })
    renderWithProviders(<DashboardPage />)

    await waitFor(() =>
      expect(screen.getByText(/nada vencido — tudo em dia/i)).toBeInTheDocument(),
    )
  })

  it('mostra mensagem de erro quando a request de resumo falha', async () => {
    server.use(
      http.get(`${API}/api/dashboard/resumo`, () =>
        HttpResponse.json({ erro: 'Falha' }, { status: 500 }),
      ),
      http.get(`${API}/api/dashboard/faturamento`, () => HttpResponse.json({ dados: [] })),
    )

    renderWithProviders(<DashboardPage />)

    await waitFor(() =>
      expect(screen.getByText(/não foi possível carregar o painel/i)).toBeInTheDocument(),
    )
  })
})
