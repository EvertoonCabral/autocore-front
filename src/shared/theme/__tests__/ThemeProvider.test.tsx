import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../ThemeProvider'
import { useTema } from '../ThemeContext'
import { ThemeToggle } from '../ThemeToggle'

function Sonda() {
  const { tema, resolvido } = useTema()
  return (
    <div>
      <span data-testid="tema">{tema}</span>
      <span data-testid="resolvido">{resolvido}</span>
    </div>
  )
}

beforeEach(() => {
  // Reset DOM e localStorage entre testes.
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
  window.localStorage.clear()

  // matchMedia stub padrão — não matcha dark.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('<ThemeProvider> + useTema', () => {
  it('sem preferência salva → resolve para light (matchMedia retorna false)', () => {
    render(
      <ThemeProvider>
        <Sonda />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('tema').textContent).toBe('system')
    expect(screen.getByTestId('resolvido').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('preferência "dark" salva → aplica classe dark em <html>', () => {
    window.localStorage.setItem('autocore:tema', 'dark')
    render(
      <ThemeProvider>
        <Sonda />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('tema').textContent).toBe('dark')
    expect(screen.getByTestId('resolvido').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('"system" + matchMedia dark → aplica dark', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    render(
      <ThemeProvider>
        <Sonda />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('resolvido').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('useTema fora do provider → lança', () => {
    expect(() => render(<Sonda />)).toThrow(/ThemeProvider/)
  })
})

describe('<ThemeToggle>', () => {
  it('clicar em "Escuro" → persiste em localStorage e aplica classe', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    const trigger = screen.getByRole('button', { name: /tema/i })
    await userEvent.click(trigger)

    // Encontra o item "Escuro" no dropdown
    const escuroItem = await screen.findByRole('menuitemradio', { name: /escuro/i })
    await act(async () => {
      await userEvent.click(escuroItem)
    })

    expect(window.localStorage.getItem('autocore:tema')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('mostra os 3 itens (Claro, Escuro, Sistema) no dropdown', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: /tema/i }))

    expect(await screen.findByRole('menuitemradio', { name: /claro/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /escuro/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /sistema/i })).toBeInTheDocument()
  })

  it('aria-label reflete a preferência salva', () => {
    window.localStorage.setItem('autocore:tema', 'light')
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(
      screen.getByRole('button', { name: /tema \(atual: claro\)/i }),
    ).toBeInTheDocument()
  })
})
