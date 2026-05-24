import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { type ReactNode } from 'react'
import { ConfiguracaoEmailForm } from '../components/ConfiguracaoEmailForm'
import type { ConfiguracaoEmailDto } from '../hooks/useObterConfiguracaoEmail'

function renderForm(
  overrides: Partial<ConfiguracaoEmailDto> = {},
  onSubmit = vi.fn().mockResolvedValue(undefined),
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        {children}
        <Toaster />
      </QueryClientProvider>
    )
  }
  const defaultValues: ConfiguracaoEmailDto = {
    smtpHost: 'smtp.example.com',
    smtpPorta: 587,
    smtpUsuario: 'user',
    smtpSenhaDefinida: true,
    emailRemetente: 'from@example.com',
    nomeRemetente: 'AutoCore',
    usarTls: true,
    usarStub: false,
    fallbackHabilitado: false,
    ...overrides,
  }
  return {
    onSubmit,
    ...render(
      <ConfiguracaoEmailForm defaultValues={defaultValues} onSubmit={onSubmit} />,
      { wrapper: Wrapper },
    ),
  }
}

describe('<ConfiguracaoEmailForm>', () => {
  it('exibe placeholder de senha quando senha definida', () => {
    renderForm({ smtpSenhaDefinida: true })
    const senha = screen.getByLabelText(/senha/i) as HTMLInputElement
    expect(senha.placeholder).toBe('••••••••')
  })

  it('senha vazia → submit não envia campo smtpSenha (preserva atual)', async () => {
    const { onSubmit } = renderForm()
    // Altera o host para "sujar" o form
    const host = screen.getByLabelText(/servidor smtp/i)
    await userEvent.clear(host)
    await userEvent.type(host, 'smtp.novo.com')

    const salvar = screen.getByRole('button', { name: /salvar/i })
    await userEvent.click(salvar)

    expect(onSubmit).toHaveBeenCalledOnce()
    const body = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>
    expect(body.smtpHost).toBe('smtp.novo.com')
    expect(body).not.toHaveProperty('smtpSenha')
  })

  it('senha preenchida → submit inclui smtpSenha', async () => {
    const { onSubmit } = renderForm()
    const senha = screen.getByLabelText(/senha/i)
    await userEvent.type(senha, 'nova-senha')

    const salvar = screen.getByRole('button', { name: /salvar/i })
    await userEvent.click(salvar)

    expect(onSubmit).toHaveBeenCalledOnce()
    const body = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>
    expect(body.smtpSenha).toBe('nova-senha')
  })

  it('e-mail remetente inválido → erro inline', async () => {
    const { onSubmit } = renderForm()
    const email = screen.getByLabelText(/e-mail remetente/i)
    await userEvent.clear(email)
    await userEvent.type(email, 'nao-eh-email')

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))

    expect(await screen.findByText(/e-mail válido/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('porta fora do intervalo → erro inline', async () => {
    const { onSubmit } = renderForm()
    const porta = screen.getByLabelText(/porta/i)
    await userEvent.clear(porta)
    await userEvent.type(porta, '99999')

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))

    expect(await screen.findByText(/≤ 65535/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('fallback toggle → muda o valor enviado', async () => {
    const { onSubmit } = renderForm({ fallbackHabilitado: false })
    // Sujamos o form ligando o switch
    const fallback = screen.getByRole('switch', { name: /habilitar fallback/i })
    await userEvent.click(fallback)

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSubmit).toHaveBeenCalledOnce()
    const body = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>
    expect(body.fallbackHabilitado).toBe(true)
  })
})
