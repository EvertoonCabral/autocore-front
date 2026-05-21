import { describe, expect, it, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { SecaoLogo } from '../components/SecaoLogo'
import type { ConfiguracaoEmpresaDto } from '@/api/types'

const API = 'http://localhost:5206'

const semLogo: ConfiguracaoEmpresaDto = {
  nomeEmpresa: 'Auto X',
  logoHash: null,
  logoMimeType: null,
}

const comLogo: ConfiguracaoEmpresaDto = {
  nomeEmpresa: 'Auto X',
  logoHash: 'abc123hash',
  logoMimeType: 'image/png',
}

// jsdom não implementa URL.createObjectURL.
beforeAll(() => {
  if (typeof URL.createObjectURL !== 'function') {
    ;(URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = vi
      .fn()
      .mockReturnValue('blob:mock-url')
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    ;(URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = vi.fn()
  }
})

afterAll(() => {
  // Não restaura — se outros suites assumem ausência, problema deles.
})

beforeEach(() => server.resetHandlers())

function makePngFile(name = 'logo.png', sizeBytes = 1_000): File {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'image/png' })
}

describe('<SecaoLogo>', () => {
  it('exibe placeholder quando não há logo', () => {
    renderWithProviders(<SecaoLogo configuracao={semLogo} />, { withAuth: false })
    expect(screen.getByText(/nenhuma logo definida/i)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /logo atual/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remover logo/i })).not.toBeInTheDocument()
  })

  it('exibe preview da logo atual com src=?v={hash} quando há logoHash', () => {
    renderWithProviders(<SecaoLogo configuracao={comLogo} />, { withAuth: false })
    const img = screen.getByRole('img', { name: /logo atual/i }) as HTMLImageElement
    expect(img.src).toContain('/api/configuracoes/empresa/logo')
    expect(img.src).toContain('v=abc123hash')
    expect(screen.getByRole('button', { name: /remover logo/i })).toBeInTheDocument()
  })

  it('selecionar arquivo válido mostra preview do arquivo e botões Enviar/Cancelar', async () => {
    renderWithProviders(<SecaoLogo configuracao={semLogo} />, { withAuth: false })

    const input = screen.getByTestId('logo-file-input') as HTMLInputElement
    const user = userEvent.setup()
    await user.upload(input, makePngFile('nova-logo.png', 50_000))

    expect(screen.getByText('nova-logo.png')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    // O preview do arquivo deve usar a object URL
    const previewImg = screen.getByRole('img', {
      name: /pré-visualização da nova logo/i,
    }) as HTMLImageElement
    expect(previewImg.src).toContain('blob:')
  })

  it('arquivo com tipo inválido mostra erro inline e não habilita Enviar', async () => {
    renderWithProviders(<SecaoLogo configuracao={semLogo} />, { withAuth: false })

    const input = screen.getByTestId('logo-file-input') as HTMLInputElement
    const arquivoPdf = new File([new Uint8Array(100)], 'doc.pdf', { type: 'application/pdf' })

    // applyAccept: false — driver-side, o usuário pode selecionar qualquer
    // arquivo (o filtro do browser não é confiável); o front valida via
    // validarArquivoLogo. Espelhar isso no teste é o comportamento correto.
    const user = userEvent.setup({ applyAccept: false })
    await user.upload(input, arquivoPdf)

    expect(screen.getByRole('alert')).toHaveTextContent(/formato não suportado/i)
    expect(screen.queryByRole('button', { name: /enviar/i })).not.toBeInTheDocument()
  })

  it('arquivo > 2MB mostra erro inline', async () => {
    renderWithProviders(<SecaoLogo configuracao={semLogo} />, { withAuth: false })

    const input = screen.getByTestId('logo-file-input') as HTMLInputElement
    const grande = makePngFile('grande.png', 2 * 1024 * 1024 + 1)

    const user = userEvent.setup()
    await user.upload(input, grande)

    expect(screen.getByRole('alert')).toHaveTextContent(/arquivo grande demais/i)
    expect(screen.queryByRole('button', { name: /enviar/i })).not.toBeInTheDocument()
  })

  it('Cancelar limpa o estado do arquivo selecionado', async () => {
    renderWithProviders(<SecaoLogo configuracao={semLogo} />, { withAuth: false })

    const input = screen.getByTestId('logo-file-input') as HTMLInputElement
    const user = userEvent.setup()
    await user.upload(input, makePngFile('nova-logo.png', 50_000))

    expect(screen.getByText('nova-logo.png')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(screen.queryByText('nova-logo.png')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /selecionar arquivo/i })).toBeInTheDocument()
  })

  it('botão Remover abre ConfirmDialog e dispara DELETE ao confirmar', async () => {
    let deleteChamado = false
    server.use(
      http.delete(`${API}/api/configuracoes/empresa/logo`, () => {
        deleteChamado = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderWithProviders(<SecaoLogo configuracao={comLogo} />, { withAuth: false })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /remover logo/i }))

    // Dialog aparece com título
    expect(
      await screen.findByText(/remover logo da empresa\?/i),
    ).toBeInTheDocument()

    // Botão de confirmação do AlertDialog (texto exato "Remover")
    const botaoConfirmar = await screen.findByRole('button', { name: /^remover$/i })
    await user.click(botaoConfirmar)

    await waitFor(() => expect(deleteChamado).toBe(true))
  })
})
