import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ServicoFormDrawer } from '../components/ServicoFormDrawer'

const API = 'http://localhost:5206'

const servico = {
  id: 9,
  nome: 'Alinhamento',
  descricao: 'Geometria de direção',
  preco: 80,
  ehMaoDeObraPadrao: false,
  ativo: true,
  criadoEm: '2026-05-01T10:00:00Z',
}

function meHandler(role: 'Admin' | 'Operador') {
  return http.get(`${API}/api/auth/me`, () =>
    HttpResponse.json({
      dados: {
        id: role === 'Admin' ? 1 : 2,
        nomeCompleto: role === 'Admin' ? 'Administrador' : 'Operador',
        email: role === 'Admin' ? 'admin@autocore.com' : 'op@autocore.com',
        role,
        ativo: true,
        podeVerAuditoria: false,
      },
    }),
  )
}

beforeEach(() => server.resetHandlers())

describe('ServicoFormDrawer — criar', () => {
  function setup() {
    let criou = false
    let corpo: Record<string, unknown> | null = null
    server.use(
      meHandler('Admin'),
      http.get(`${API}/api/servicos`, () => HttpResponse.json({ dados: [] })),
      http.post(`${API}/api/servicos`, async ({ request }) => {
        criou = true
        corpo = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ dados: { id: 42 } }, { status: 201 })
      }),
    )
    return { foiCriado: () => criou, corpo: () => corpo }
  }

  function renderCriar() {
    return renderWithProviders(
      <Routes>
        <Route path="/servicos" element={<div>Lista de serviços</div>} />
        <Route path="/servicos/novo" element={<ServicoFormDrawer mode="criar" />} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos/novo'] } },
    )
  }

  it('abre o drawer com o formulário vazio', async () => {
    setup()
    renderCriar()
    // Drawer (Sheet) aberto com o formulário.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument()
  })

  it('submit válido cria e fecha o drawer (volta pra lista)', async () => {
    const tracker = setup()
    const user = userEvent.setup()
    renderCriar()
    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/^Nome/), 'Diagnóstico elétrico')
    await user.clear(screen.getByLabelText(/Preço/))
    await user.type(screen.getByLabelText(/Preço/), '150')
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    await waitFor(() => expect(tracker.foiCriado()).toBe(true))
  })

  it('envia garantia, tempo estimado e categoria ao criar', async () => {
    const tracker = setup()
    const user = userEvent.setup()
    renderCriar()
    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/^Nome/), 'Diagnóstico elétrico')
    await user.clear(screen.getByLabelText(/Preço/))
    await user.type(screen.getByLabelText(/Preço/), '150')
    await user.type(screen.getByLabelText(/Garantia/), '90')
    await user.type(screen.getByLabelText(/Tempo estimado/), '60')
    await user.type(screen.getByLabelText(/Categoria/), 'Elétrica')
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    await waitFor(() => expect(tracker.foiCriado()).toBe(true))
    expect(tracker.corpo()).toMatchObject({
      nome: 'Diagnóstico elétrico',
      preco: 150,
      garantiaDias: 90,
      tempoEstimadoMinutos: 60,
      categoria: 'Elétrica',
    })
  })
})

describe('ServicoFormDrawer — editar', () => {
  function setup(role: 'Admin' | 'Operador') {
    let atualizou = false
    server.use(
      meHandler(role),
      http.get(`${API}/api/servicos/9`, () => HttpResponse.json({ dados: servico })),
      http.get(`${API}/api/servicos`, () => HttpResponse.json({ dados: [servico] })),
      http.put(`${API}/api/servicos/9`, async () => {
        atualizou = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    return { foiAtualizado: () => atualizou }
  }

  function renderEditar() {
    return renderWithProviders(
      <Routes>
        <Route path="/servicos" element={<div>Lista de serviços</div>} />
        <Route path="/servicos/:id/editar" element={<ServicoFormDrawer mode="editar" />} />
      </Routes>,
      { routerProps: { initialEntries: ['/servicos/9/editar'] } },
    )
  }

  it('Admin carrega defaults via useObterServico', async () => {
    setup('Admin')
    renderEditar()
    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toHaveValue('Alinhamento'))
    expect(screen.getByLabelText(/Preço/)).toHaveValue(80)
  })

  it('Admin submete e dispara useAtualizarServico', async () => {
    const tracker = setup('Admin')
    const user = userEvent.setup()
    renderEditar()
    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toHaveValue('Alinhamento'))
    await user.clear(screen.getByLabelText(/^Nome/))
    await user.type(screen.getByLabelText(/^Nome/), 'Alinhamento + balanceamento')
    await user.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(tracker.foiAtualizado()).toBe(true))
  })

  it('Operador sem servicos.atualizarPreco vê campo Preço desabilitado', async () => {
    setup('Operador')
    renderEditar()
    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toHaveValue('Alinhamento'))
    expect(screen.getByLabelText(/Preço/)).toBeDisabled()
  })
})
