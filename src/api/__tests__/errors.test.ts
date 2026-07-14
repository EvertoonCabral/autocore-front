import { describe, expect, it, vi } from 'vitest'
import { ApiError, aplicarErrosValidacao, isValidationError, toApiError } from '../errors'

describe('toApiError', () => {
  it('sem status vira erro de rede', () => {
    const err = toApiError(undefined, undefined)
    expect(err.kind).toBe('network')
    expect(err.status).toBe(0)
  })

  it('422 carrega os detalhes { campo, mensagem }', () => {
    const err = toApiError(
      { erro: 'Dados inválidos.', detalhes: [{ campo: 'nome', mensagem: 'Obrigatório' }] },
      422,
    )
    expect(err.kind).toBe('validation')
    expect(err.detalhes).toEqual([{ campo: 'nome', mensagem: 'Obrigatório' }])
  })

  it('mapeia status para kind', () => {
    expect(toApiError({}, 401).kind).toBe('unauthorized')
    expect(toApiError({}, 403).kind).toBe('forbidden')
    expect(toApiError({}, 404).kind).toBe('notFound')
    expect(toApiError({}, 400).kind).toBe('business')
    expect(toApiError({}, 500).kind).toBe('server')
  })
})

describe('aplicarErrosValidacao', () => {
  it('não faz nada quando o erro não é de validação', () => {
    const setError = vi.fn()
    const naoAtribuidos = aplicarErrosValidacao(new ApiError('business', 400, 'x'), setError)
    expect(setError).not.toHaveBeenCalled()
    expect(naoAtribuidos).toEqual([])
  })

  it('distribui cada detalhe no campo indicado pelo back', () => {
    const setError = vi.fn()
    const err = new ApiError('validation', 422, 'Dados inválidos.', [
      { campo: 'nome', mensagem: 'Obrigatório' },
      { campo: 'telefone', mensagem: 'Formato inválido' },
    ])

    const naoAtribuidos = aplicarErrosValidacao(err, setError)

    expect(setError).toHaveBeenCalledWith('nome', { type: 'server', message: 'Obrigatório' })
    expect(setError).toHaveBeenCalledWith('telefone', { type: 'server', message: 'Formato inválido' })
    expect(naoAtribuidos).toEqual([])
  })

  it('aplica alias quando o nome no form difere do back', () => {
    const setError = vi.fn()
    const err = new ApiError('validation', 422, 'x', [{ campo: 'cpf', mensagem: 'inválido' }])

    aplicarErrosValidacao(err, setError, { aliases: { cpf: 'cpfCnpj' } })

    expect(setError).toHaveBeenCalledWith('cpfCnpj', { type: 'server', message: 'inválido' })
  })

  it('retorna mensagens sem campo ou fora de camposValidos em vez de descartá-las', () => {
    const setError = vi.fn()
    const err = new ApiError('validation', 422, 'x', [
      { campo: '', mensagem: 'Erro geral' },
      { campo: 'desconhecido', mensagem: 'Campo estranho' },
      { campo: 'nome', mensagem: 'Obrigatório' },
    ])

    const naoAtribuidos = aplicarErrosValidacao(err, setError, { camposValidos: ['nome'] })

    expect(setError).toHaveBeenCalledTimes(1)
    expect(setError).toHaveBeenCalledWith('nome', { type: 'server', message: 'Obrigatório' })
    expect(naoAtribuidos).toEqual(['Erro geral', 'Campo estranho'])
  })
})

describe('isValidationError', () => {
  it('só reconhece ApiError de validação', () => {
    expect(isValidationError(new ApiError('validation', 422, 'x'))).toBe(true)
    expect(isValidationError(new ApiError('business', 400, 'x'))).toBe(false)
    expect(isValidationError(new Error('x'))).toBe(false)
  })
})
