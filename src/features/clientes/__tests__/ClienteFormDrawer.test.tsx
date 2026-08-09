import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { ClientesListPage } from '../routes/ClientesListPage'
import { ClienteFormDrawer } from '../components/ClienteFormDrawer'

const API = 'http://localhost:5206'

function setup() {
  let criou = false
  let corpoCriar: Record<string, unknown> | null = null
  server.use(
    http.get(`${API}/api/auth/me`, () =>
      HttpResponse.json({
        dados: {
          id: 1,
          nomeCompleto: 'Administrador',
          email: 'admin@autocore.com',
          role: 'Admin',
          ativo: true,
          podeVerAuditoria: true,
        },
      }),
    ),
    http.get(`${API}/api/clientes`, () =>
      HttpResponse.json({
        dados: [{ id: 7, nome: 'Cliente Existente', telefone: '44988887777', ativo: true }],
        total: 1,
        pagina: 1,
        porPagina: 20,
      }),
    ),
    http.post(`${API}/api/clientes`, async ({ request }) => {
      criou = true
      corpoCriar = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ dados: { id: 55 } }, { status: 201 })
    }),
  )
  return { foiCriado: () => criou, corpoCriar: () => corpoCriar }
}

beforeEach(() => server.resetHandlers())

function renderNovo() {
  return renderWithProviders(
    <Routes>
      <Route path="/clientes" element={<ClientesListPage />}>
        <Route path="novo" element={<ClienteFormDrawer mode="criar" />} />
      </Route>
    </Routes>,
    { routerProps: { initialEntries: ['/clientes/novo'] } },
  )
}

describe('ClienteFormDrawer', () => {
  it('/clientes/novo mostra a lista atrás e o drawer aberto', async () => {
    setup()
    renderNovo()

    // Lista montada atrás (título da página + linha existente).
    await waitFor(() => expect(screen.getByText('Cliente Existente')).toBeInTheDocument())
    // Drawer aberto com o formulário.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument()
  })

  it('submeter cria o cliente e fecha o drawer', async () => {
    const tracker = setup()
    const user = userEvent.setup()
    renderNovo()

    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/^Nome/), 'João da Silva')
    await user.type(screen.getByLabelText(/^Telefone \*/), '44999990000')
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    await waitFor(() => expect(tracker.foiCriado()).toBe(true))
    // Drawer fechou: não há mais dialog na tela.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('preenche o endereço via ViaCEP ao completar o CEP e envia ao criar', async () => {
    const tracker = setup()
    server.use(
      http.get('https://viacep.com.br/ws/:cep/json/', () =>
        HttpResponse.json({
          logradouro: 'Rua das Flores',
          bairro: 'Centro',
          localidade: 'Maringá',
          uf: 'PR',
        }),
      ),
    )
    const user = userEvent.setup()
    renderNovo()

    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/^Nome/), 'João da Silva')
    await user.type(screen.getByLabelText(/^Telefone \*/), '44999990000')
    await user.type(screen.getByLabelText(/Telefone secundário/), '4433330000')
    await user.type(screen.getByLabelText(/^CEP/), '87010-000')
    // Busca é explícita: clicar na lupa dispara o ViaCEP.
    await user.click(screen.getByRole('button', { name: /buscar endereço pelo cep/i }))

    // O ViaCEP preenche logradouro/bairro/cidade/uf.
    await waitFor(() =>
      expect(screen.getByLabelText(/Logradouro/)).toHaveValue('Rua das Flores'),
    )
    expect(screen.getByLabelText(/Bairro/)).toHaveValue('Centro')
    expect(screen.getByLabelText(/Cidade/)).toHaveValue('Maringá')
    expect(screen.getByLabelText(/^UF/)).toHaveValue('PR')

    // Número não é sobrescrito pela busca — usuário digita.
    await user.type(screen.getByLabelText(/^Número/), '123')
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    await waitFor(() => expect(tracker.foiCriado()).toBe(true))
    expect(tracker.corpoCriar()).toMatchObject({
      nome: 'João da Silva',
      telefone: '44999990000',
      segundoTelefone: '4433330000',
      cep: '87010000',
      logradouro: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Maringá',
      uf: 'PR',
    })
  })

  it('CEP inexistente mostra mensagem e não preenche o endereço', async () => {
    setup()
    server.use(
      http.get('https://viacep.com.br/ws/:cep/json/', () =>
        HttpResponse.json({ erro: true }),
      ),
    )
    const user = userEvent.setup()
    renderNovo()

    await waitFor(() => expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/^CEP/), '99999-999')
    await user.click(screen.getByRole('button', { name: /buscar endereço pelo cep/i }))

    await waitFor(() =>
      expect(screen.getByText(/CEP não encontrado/i)).toBeInTheDocument(),
    )
    expect(screen.getByLabelText(/Logradouro/)).toHaveValue('')
    expect(screen.getByLabelText(/Cidade/)).toHaveValue('')
  })
})

describe('ClienteFormDrawer — editar', () => {
  const cliente = {
    id: 7,
    nome: 'Cliente Existente',
    telefone: '44988887777',
    segundoTelefone: '4433330000',
    email: null,
    cpfCnpj: null,
    cep: '87010000',
    logradouro: 'Rua das Flores',
    numero: '123',
    bairro: 'Centro',
    cidade: 'Maringá',
    uf: 'PR',
    observacoes: null,
    ativo: true,
    criadoEm: '2026-05-01T10:00:00Z',
  }

  function setupEditar() {
    let corpo: Record<string, unknown> | null = null
    server.use(
      http.get(`${API}/api/auth/me`, () =>
        HttpResponse.json({
          dados: {
            id: 1,
            nomeCompleto: 'Administrador',
            email: 'admin@autocore.com',
            role: 'Admin',
            ativo: true,
            podeVerAuditoria: true,
          },
        }),
      ),
      http.get(`${API}/api/clientes/7`, () => HttpResponse.json({ dados: cliente })),
      http.put(`${API}/api/clientes/7`, async ({ request }) => {
        corpo = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    return { corpo: () => corpo }
  }

  function renderEditar() {
    return renderWithProviders(
      <Routes>
        <Route path="/clientes" element={<div>Lista</div>} />
        <Route path="/clientes/:id/editar" element={<ClienteFormDrawer mode="editar" />} />
      </Routes>,
      { routerProps: { initialEntries: ['/clientes/7/editar'] } },
    )
  }

  it('pré-preenche os novos campos e os reenvia ao salvar', async () => {
    const tracker = setupEditar()
    const user = userEvent.setup()
    renderEditar()

    // Modo edição: o form carrega os campos estruturados do ClienteDto.
    await waitFor(() => expect(screen.getByLabelText(/Logradouro/)).toHaveValue('Rua das Flores'))
    expect(screen.getByLabelText(/Cidade/)).toHaveValue('Maringá')
    expect(screen.getByLabelText(/^UF/)).toHaveValue('PR')
    expect(screen.getByLabelText(/Telefone secundário/)).toHaveValue('(44) 3333-0000')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    // Round-trip: os novos campos voltam no PUT (só-dígitos após unmask).
    await waitFor(() => expect(tracker.corpo()).not.toBeNull())
    expect(tracker.corpo()).toMatchObject({
      cidade: 'Maringá',
      logradouro: 'Rua das Flores',
      cep: '87010000',
      uf: 'PR',
      segundoTelefone: '4433330000',
    })
  })

  it('permite substituir um campo já preenchido (digitar um CEP novo) em edição', async () => {
    const tracker = setupEditar()
    const user = userEvent.setup()
    renderEditar()

    const cep = await screen.findByLabelText(/^CEP/)
    await waitFor(() => expect(cep).toHaveValue('87010000'))

    // Substitui o CEP existente por um novo — o valor digitado deve PERMANECER
    // no campo (não pode ser revertido por um reset a cada render).
    await user.clear(cep)
    await user.type(cep, '80010000')
    expect(cep).toHaveValue('80010000')

    await user.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(tracker.corpo()).not.toBeNull())
    expect(tracker.corpo()).toMatchObject({ cep: '80010000' })
  })
})
