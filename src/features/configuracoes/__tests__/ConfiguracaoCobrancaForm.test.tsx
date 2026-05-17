import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { ConfiguracaoCobrancaForm } from '../components/ConfiguracaoCobrancaForm'
import type { ConfiguracaoCobrancaDto } from '../hooks/useObterConfiguracaoCobranca'

const baseDto: ConfiguracaoCobrancaDto = {
  baseUrl: 'http://localhost:8080',
  apiKeyDefinida: true,
  instancia: 'autocore',
  usarStub: false,
}

describe('<ConfiguracaoCobrancaForm>', () => {
  it('renderiza com defaultValues populados', () => {
    renderWithProviders(
      <ConfiguracaoCobrancaForm defaultValues={baseDto} onSubmit={vi.fn()} />,
      { withAuth: false },
    )

    expect(screen.getByLabelText(/url base/i)).toHaveValue('http://localhost:8080')
    expect(screen.getByLabelText(/instância/i)).toHaveValue('autocore')
    expect(screen.getByRole('switch', { name: /modo stub/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('mostra texto auxiliar "Definida (oculta)" quando apiKeyDefinida=true', () => {
    renderWithProviders(
      <ConfiguracaoCobrancaForm
        defaultValues={{ ...baseDto, apiKeyDefinida: true }}
        onSubmit={vi.fn()}
      />,
      { withAuth: false },
    )

    expect(
      screen.getByText(/definida \(oculta\)\. deixe em branco para manter/i),
    ).toBeInTheDocument()
  })

  it('mostra texto auxiliar "Nenhuma chave definida" quando apiKeyDefinida=false', () => {
    renderWithProviders(
      <ConfiguracaoCobrancaForm
        defaultValues={{ ...baseDto, apiKeyDefinida: false }}
        onSubmit={vi.fn()}
      />,
      { withAuth: false },
    )

    expect(screen.getByText(/nenhuma chave definida/i)).toBeInTheDocument()
  })

  it('apiKey vazia ao submeter NÃO envia a chave no payload', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(
      <ConfiguracaoCobrancaForm defaultValues={baseDto} onSubmit={onSubmit} />,
      { withAuth: false },
    )

    const user = userEvent.setup()
    // Altera algo para o form ficar dirty (apiKey vazia, mudamos instancia).
    const instancia = screen.getByLabelText(/instância/i)
    await user.clear(instancia)
    await user.type(instancia, 'producao')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const payload = onSubmit.mock.calls[0]![0] as Record<string, unknown>
    expect(payload).toEqual({
      baseUrl: 'http://localhost:8080',
      instancia: 'producao',
      usarStub: false,
    })
    expect(payload.apiKey).toBeUndefined()
  })

  it('apiKey preenchida envia a chave no payload', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(
      <ConfiguracaoCobrancaForm defaultValues={baseDto} onSubmit={onSubmit} />,
      { withAuth: false },
    )

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/api key/i), 'nova-chave')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const payload = onSubmit.mock.calls[0]![0] as Record<string, unknown>
    expect(payload).toMatchObject({
      baseUrl: 'http://localhost:8080',
      instancia: 'autocore',
      usarStub: false,
      apiKey: 'nova-chave',
    })
  })

  it('Switch usarStub alterna o valor enviado', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(
      <ConfiguracaoCobrancaForm defaultValues={baseDto} onSubmit={onSubmit} />,
      { withAuth: false },
    )

    const user = userEvent.setup()
    const switchEl = screen.getByRole('switch', { name: /modo stub/i })
    expect(switchEl).toHaveAttribute('aria-checked', 'false')

    await user.click(switchEl)
    expect(switchEl).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const payload = onSubmit.mock.calls[0]![0] as Record<string, unknown>
    expect(payload.usarStub).toBe(true)
  })

  it('botão Salvar fica desabilitado quando o form não está dirty', () => {
    renderWithProviders(
      <ConfiguracaoCobrancaForm defaultValues={baseDto} onSubmit={vi.fn()} />,
      { withAuth: false },
    )

    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled()
  })
})
