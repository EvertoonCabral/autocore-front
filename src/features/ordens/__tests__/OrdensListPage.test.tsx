import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor, within } from '@/test/render'
import { server } from '@/test/msw/server'
import { OrdensListPage } from '../routes/OrdensListPage'
import type { ListaOrdensServicoDto, OrdemServicoResumoDto } from '@/api/types'

const API = 'http://localhost:5206'

const ordens: OrdemServicoResumoDto[] = [
  {
    id: 1,
    numero: 'OS-2026-0001',
    clienteId: 10,
    clienteNome: 'João Silva',
    status: 1,
    abertaEm: '2026-08-01T10:00:00Z',
    totalGeral: 300,
    saldoDevedor: 200,
    veiculoId: 5,
    veiculoDescricao: 'Gol 2015 — ABC1D23',
  },
  {
    id: 2,
    numero: 'OS-2026-0002',
    clienteId: 11,
    clienteNome: 'Maria Souza',
    status: 2,
    abertaEm: '2026-08-02T10:00:00Z',
    totalGeral: 150,
    saldoDevedor: 0,
    veiculoId: null,
    veiculoDescricao: null,
  },
]

function lista(dados: OrdemServicoResumoDto[]): ListaOrdensServicoDto {
  return {
    dados,
    total: dados.length,
    pagina: 1,
    porPagina: 20,
    somaTotalGeral: 450,
    somaSaldoDevedor: 200,
  }
}

function renderPage(initial = '/ordens') {
  return renderWithProviders(
    <Routes>
      <Route path="/ordens" element={<OrdensListPage />} />
      <Route path="/ordens/:id" element={<div>Detalhe</div>} />
    </Routes>,
    { routerProps: { initialEntries: [initial] } },
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('OrdensListPage — Lista', () => {
  it('renderiza a coluna Veículo e o rodapé com soma de saldos do filtro', async () => {
    server.use(http.get(`${API}/api/ordens`, () => HttpResponse.json(lista(ordens))))
    renderPage()

    await waitFor(() => expect(screen.getByText('João Silva')).toBeInTheDocument())

    // Coluna Veículo: descrição quando existe, "—" quando não.
    expect(screen.getByText('Gol 2015 — ABC1D23')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()

    // Rodapé com soma do conjunto filtrado inteiro (não só a página).
    expect(screen.getByText(/saldo total \(filtro\)/i)).toBeInTheDocument()
    // R$ 200,00 aparece na linha (saldo) e no rodapé (soma) — pelo menos 1.
    expect(screen.getAllByText(/R\$\s*200,00/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/total geral \(filtro\)/i)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*450,00/)).toBeInTheDocument()
  })

  it('a busca envia o parâmetro `filtro` na request', async () => {
    let ultimoFiltro: string | null = null
    server.use(
      http.get(`${API}/api/ordens`, ({ request }) => {
        ultimoFiltro = new URL(request.url).searchParams.get('filtro')
        return HttpResponse.json(lista(ordens))
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('João Silva')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText(/número, cliente ou placa/i), 'gol')

    await waitFor(() => expect(ultimoFiltro).toBe('gol'), { timeout: 2000 })
    expect(screen.getByText(/resultado/i)).toBeInTheDocument()
  })
})

describe('OrdensListPage — alternância de visão', () => {
  it('alterna para Quadro e persiste em localStorage', async () => {
    server.use(http.get(`${API}/api/ordens`, () => HttpResponse.json(lista(ordens))))
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('João Silva')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /quadro/i }))

    // Colunas do quadro aparecem (region com nome acessível).
    await waitFor(() =>
      expect(screen.getByRole('region', { name: /coluna aberta/i })).toBeInTheDocument(),
    )
    expect(window.localStorage.getItem('osViewMode')).toBe('quadro')
  })

  it('respeita o modo salvo em localStorage ao montar', async () => {
    window.localStorage.setItem('osViewMode', 'quadro')
    server.use(http.get(`${API}/api/ordens`, () => HttpResponse.json(lista([]))))
    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('region', { name: /coluna concluída/i })).toBeInTheDocument(),
    )
    // Colunas do quadro presentes (não a tabela da lista).
    expect(screen.getByRole('region', { name: /coluna aberta/i })).toBeInTheDocument()
    // Mensagem de vazio aparece após a carga (troca o skeleton).
    await waitFor(() => {
      const concluida = within(screen.getByRole('region', { name: /coluna concluída/i }))
      expect(concluida.getByText(/nada concluído/i)).toBeInTheDocument()
    })
  })
})
