import { describe, expect, it, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { AccentProvider } from '../AccentProvider'
import { hexToHslTriplet } from '../color'

const API = 'http://localhost:5206'
const STYLE_ID = 'autocore-accent-vars'

beforeEach(() => {
  server.resetHandlers()
  document.getElementById(STYLE_ID)?.remove()
})

describe('<AccentProvider>', () => {
  it('injeta as CSS vars do accent a partir do GET empresa (MSW)', async () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({
          dados: { nomeEmpresa: 'Oficina X', accentLight: '#1F5F8B', accentDark: null },
        }),
      ),
    )

    renderWithProviders(
      <AccentProvider>
        <div>app</div>
      </AccentProvider>,
      { withAuth: false },
    )

    await waitFor(() => {
      const style = document.getElementById(STYLE_ID)
      expect(style).not.toBeNull()
      expect(style?.textContent ?? '').toContain(`--primary: ${hexToHslTriplet('#1F5F8B')}`)
    })

    const css = document.getElementById(STYLE_ID)?.textContent ?? ''
    expect(css).toContain(':root {')
    expect(css).toContain('.dark {')
  })

  it('mantém defaults (não injeta) quando o GET falha', async () => {
    server.use(
      http.get(`${API}/api/configuracoes/empresa`, () =>
        HttpResponse.json({ erro: 'Erro' }, { status: 500 }),
      ),
    )

    renderWithProviders(
      <AccentProvider>
        <div>app</div>
      </AccentProvider>,
      { withAuth: false },
    )

    // Sem data → o provider não cria o <style> (defaults do globals.css valem).
    await waitFor(() => {
      expect(document.getElementById(STYLE_ID)).toBeNull()
    })
  })
})
