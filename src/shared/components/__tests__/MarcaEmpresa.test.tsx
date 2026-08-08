import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { MarcaEmpresa } from '../MarcaEmpresa'

const API = 'http://localhost:5206'

beforeEach(() => server.resetHandlers())

describe('<MarcaEmpresa>', () => {
  it('renderiza <img> apontando para o endpoint com ?v={hash} quando há logoHash', async () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({
          dados: {
            nomeEmpresa: 'Oficina Teste',
            logoHash: 'abc123def4',
            logoMimeType: 'image/png',
          },
        }),
      ),
    )

    renderWithProviders(<MarcaEmpresa size="md" />, { withAuth: false })

    const img = (await screen.findByRole('img', { name: /oficina teste/i })) as HTMLImageElement
    expect(img.src).toContain('/api/configuracoes/empresa/logo')
    expect(img.src).toContain('v=abc123def4')
  })

  it('fallback "text-only": só o nome em texto quando não há logo', async () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({
          dados: { nomeEmpresa: 'Auto Elétrica X', logoHash: null, logoMimeType: null },
        }),
      ),
    )

    renderWithProviders(<MarcaEmpresa size="sm" fallback="text-only" />, { withAuth: false })

    await waitFor(() =>
      expect(screen.getByText('Auto Elétrica X')).toBeInTheDocument(),
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('fallback "icon-square": ícone de raio em quadrado + nome ao lado (Sidebar)', async () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({
          dados: { nomeEmpresa: 'Sem Logo Sidebar', logoHash: null, logoMimeType: null },
        }),
      ),
    )

    const { container } = renderWithProviders(
      <MarcaEmpresa size="sm" fallback="icon-square" />,
      { withAuth: false },
    )

    await waitFor(() =>
      expect(screen.getByText('Sem Logo Sidebar')).toBeInTheDocument(),
    )
    // Ícone SVG do lucide renderiza como <svg> dentro do quadrado laranja
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('fallback "icon-circle": ícone de raio em círculo + nome embaixo (LoginPage)', async () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({
          dados: { nomeEmpresa: 'Sem Logo Login', logoHash: null, logoMimeType: null },
        }),
      ),
    )

    const { container } = renderWithProviders(
      <MarcaEmpresa size="lg" fallback="icon-circle" />,
      { withAuth: false },
    )

    await waitFor(() =>
      expect(screen.getByText('Sem Logo Login')).toBeInTheDocument(),
    )
    // Verifica classe rounded-full (distintivo do círculo vs quadrado)
    const circulo = container.querySelector('.rounded-full')
    expect(circulo).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('fallback "AutoCore" quando a query ainda não respondeu', () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({ erro: 'Erro' }, { status: 500 }),
      ),
    )

    renderWithProviders(<MarcaEmpresa />, { withAuth: false })
    expect(screen.getByText('AutoCore')).toBeInTheDocument()
  })
})
