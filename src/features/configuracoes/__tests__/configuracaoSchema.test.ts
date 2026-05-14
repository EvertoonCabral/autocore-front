import { describe, expect, it } from 'vitest'
import {
  MENSAGEM_PREVIEW_SAMPLE,
  configuracoesFormSchema,
  renderizarMensagemPreview,
} from '../helpers/configuracaoSchema'

const baseValido = {
  diasParaCobranca: 5,
  mensagemCobranca: 'Olá {Cliente}, OS {Numero} em atraso (R$ {Valor}).',
  precosAtualizadosEm: '',
}

describe('configuracoesFormSchema', () => {
  it('aceita valores válidos', () => {
    expect(configuracoesFormSchema.safeParse(baseValido).success).toBe(true)
  })

  it('aceita diasParaCobranca = 0', () => {
    expect(
      configuracoesFormSchema.safeParse({ ...baseValido, diasParaCobranca: 0 }).success,
    ).toBe(true)
  })

  it('rejeita diasParaCobranca negativo', () => {
    expect(
      configuracoesFormSchema.safeParse({ ...baseValido, diasParaCobranca: -1 }).success,
    ).toBe(false)
  })

  it('rejeita diasParaCobranca não inteiro', () => {
    expect(
      configuracoesFormSchema.safeParse({ ...baseValido, diasParaCobranca: 3.5 }).success,
    ).toBe(false)
  })

  it('rejeita mensagemCobranca com menos de 10 caracteres', () => {
    expect(
      configuracoesFormSchema.safeParse({ ...baseValido, mensagemCobranca: 'curto' }).success,
    ).toBe(false)
  })

  it('rejeita mensagemCobranca com mais de 2000 caracteres', () => {
    expect(
      configuracoesFormSchema.safeParse({
        ...baseValido,
        mensagemCobranca: 'a'.repeat(2001),
      }).success,
    ).toBe(false)
  })

  it('aceita precosAtualizadosEm vazio', () => {
    expect(
      configuracoesFormSchema.safeParse({ ...baseValido, precosAtualizadosEm: '' }).success,
    ).toBe(true)
  })

  it('aceita precosAtualizadosEm em ISO-8601', () => {
    expect(
      configuracoesFormSchema.safeParse({
        ...baseValido,
        precosAtualizadosEm: '2026-05-14T10:30:00Z',
      }).success,
    ).toBe(true)
  })

  it('rejeita precosAtualizadosEm com formato inválido', () => {
    expect(
      configuracoesFormSchema.safeParse({
        ...baseValido,
        precosAtualizadosEm: 'ontem',
      }).success,
    ).toBe(false)
  })
})

describe('renderizarMensagemPreview', () => {
  it('substitui todos os placeholders', () => {
    const r = renderizarMensagemPreview(
      'Olá {Cliente}, OS {Numero} no valor R$ {Valor} vence em {Vencimento}.',
    )
    expect(r).toContain(MENSAGEM_PREVIEW_SAMPLE.Cliente)
    expect(r).toContain(MENSAGEM_PREVIEW_SAMPLE.Numero)
    expect(r).toContain(MENSAGEM_PREVIEW_SAMPLE.Valor)
    expect(r).toContain(MENSAGEM_PREVIEW_SAMPLE.Vencimento)
  })

  it('suporta o alias {Vencimento:dd/MM/yyyy}', () => {
    const r = renderizarMensagemPreview('Vence em {Vencimento:dd/MM/yyyy}.')
    expect(r).toContain(MENSAGEM_PREVIEW_SAMPLE.Vencimento)
  })

  it('substitui o mesmo placeholder múltiplas vezes', () => {
    const r = renderizarMensagemPreview('{Cliente} - {Cliente}')
    expect(r).toBe(`${MENSAGEM_PREVIEW_SAMPLE.Cliente} - ${MENSAGEM_PREVIEW_SAMPLE.Cliente}`)
  })

  it('devolve string vazia quando template é vazio', () => {
    expect(renderizarMensagemPreview('')).toBe('')
  })
})
