import { describe, expect, it } from 'vitest'
import { clienteSchema } from '../helpers/clienteSchema'

describe('clienteSchema', () => {
  const valido = {
    nome: 'João Silva',
    telefone: '44999990000',
    email: '',
    cpfCnpj: '',
    endereco: '',
    observacoes: '',
  }

  it('aceita nome + telefone obrigatórios e demais vazios', () => {
    const r = clienteSchema.safeParse(valido)
    expect(r.success).toBe(true)
  })

  it.each(['', 'Ab'])('rejeita nome com menos de 3 caracteres (%s)', (nome) => {
    const r = clienteSchema.safeParse({ ...valido, nome })
    expect(r.success).toBe(false)
  })

  it('rejeita telefone com letras', () => {
    const r = clienteSchema.safeParse({ ...valido, telefone: '4499abc0000' })
    expect(r.success).toBe(false)
  })

  it.each(['123456789', '12345678901234'])('rejeita telefone fora de 10..13 dígitos (%s)', (telefone) => {
    const r = clienteSchema.safeParse({ ...valido, telefone })
    expect(r.success).toBe(false)
  })

  it('rejeita email com formato inválido', () => {
    const r = clienteSchema.safeParse({ ...valido, email: 'sem-arroba' })
    expect(r.success).toBe(false)
  })

  it('aceita CPF com exatos 11 dígitos', () => {
    const r = clienteSchema.safeParse({ ...valido, cpfCnpj: '12345678901' })
    expect(r.success).toBe(true)
  })

  it('aceita CNPJ com exatos 14 dígitos', () => {
    const r = clienteSchema.safeParse({ ...valido, cpfCnpj: '12345678000190' })
    expect(r.success).toBe(true)
  })

  it.each(['1234567890', '123456789012', '12345678901234567'])(
    'rejeita CPF/CNPJ fora de 11 ou 14 dígitos (%s)',
    (cpfCnpj) => {
      const r = clienteSchema.safeParse({ ...valido, cpfCnpj })
      expect(r.success).toBe(false)
    },
  )

  it('rejeita observações acima de 1000 caracteres', () => {
    const r = clienteSchema.safeParse({ ...valido, observacoes: 'a'.repeat(1001) })
    expect(r.success).toBe(false)
  })

  it('aceita observações com até 1000 caracteres', () => {
    const r = clienteSchema.safeParse({ ...valido, observacoes: 'a'.repeat(1000) })
    expect(r.success).toBe(true)
  })

  it('transforma email/cpfCnpj/endereco/observacoes vazios em null (compatível com back)', () => {
    const r = clienteSchema.parse(valido)
    expect(r.email).toBeNull()
    expect(r.cpfCnpj).toBeNull()
    expect(r.endereco).toBeNull()
    expect(r.observacoes).toBeNull()
  })

  // ─── Stripping de máscara antes da validação ─────────────────────────
  // O input do form mantém máscara visual; schema remove antes de validar
  // e antes de enviar ao back. Sem isso, o usuário editando um cliente vê
  // o erro "Telefone deve conter apenas dígitos" mesmo digitando um número
  // válido (bug reportado).

  it('aceita telefone com máscara "(45) 99992-5801" e exporta só dígitos', () => {
    const r = clienteSchema.parse({ ...valido, telefone: '(45) 99992-5801' })
    expect(r.telefone).toBe('45999925801')
  })

  it('aceita telefone com hífen "44999990000" sem alteração', () => {
    const r = clienteSchema.parse({ ...valido, telefone: '44999990000' })
    expect(r.telefone).toBe('44999990000')
  })

  it('rejeita telefone mascarado quando o total de dígitos é insuficiente', () => {
    const r = clienteSchema.safeParse({ ...valido, telefone: '(44) 9999-000' })
    expect(r.success).toBe(false)
  })

  it('aceita CPF com máscara "012.345.678-91" e exporta só dígitos', () => {
    const r = clienteSchema.parse({ ...valido, cpfCnpj: '012.345.678-91' })
    expect(r.cpfCnpj).toBe('01234567891')
  })

  it('aceita CNPJ com máscara "12.345.678/0001-90" e exporta só dígitos', () => {
    const r = clienteSchema.parse({ ...valido, cpfCnpj: '12.345.678/0001-90' })
    expect(r.cpfCnpj).toBe('12345678000190')
  })

  it('rejeita CPF/CNPJ mascarado quando o total de dígitos não bate', () => {
    const r = clienteSchema.safeParse({ ...valido, cpfCnpj: '012.345.678-9' })
    expect(r.success).toBe(false)
  })

  it('aceita CPF/CNPJ vazio mesmo com caracteres-máscara digitados sem dígitos', () => {
    // se o user apaga tudo e sobra só pontuação, normaliza para null
    const r = clienteSchema.parse({ ...valido, cpfCnpj: '...---' })
    expect(r.cpfCnpj).toBeNull()
  })
})
