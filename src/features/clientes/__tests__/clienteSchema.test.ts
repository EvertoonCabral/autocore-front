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
})
