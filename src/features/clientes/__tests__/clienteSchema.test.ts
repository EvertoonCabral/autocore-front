import { describe, expect, it } from 'vitest'
import { clienteSchema } from '../helpers/clienteSchema'

describe('clienteSchema', () => {
  const valido = {
    nome: 'João Silva',
    telefone: '44999990000',
    segundoTelefone: '',
    email: '',
    cpfCnpj: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
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

  it('transforma email/cpfCnpj/observacoes vazios em null (compatível com back)', () => {
    const r = clienteSchema.parse(valido)
    expect(r.email).toBeNull()
    expect(r.cpfCnpj).toBeNull()
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

  // ─── Endereço estruturado + segundo telefone (Fase F) ────────────────

  it('aceita endereço estruturado completo e exporta os campos', () => {
    const r = clienteSchema.parse({
      ...valido,
      cep: '87010-000',
      logradouro: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Maringá',
      uf: 'pr',
    })
    expect(r.cep).toBe('87010000')
    expect(r.logradouro).toBe('Rua das Flores')
    expect(r.numero).toBe('123')
    expect(r.bairro).toBe('Centro')
    expect(r.cidade).toBe('Maringá')
    expect(r.uf).toBe('PR')
  })

  it('normaliza endereço estruturado vazio para null', () => {
    const r = clienteSchema.parse(valido)
    expect(r.cep).toBeNull()
    expect(r.logradouro).toBeNull()
    expect(r.numero).toBeNull()
    expect(r.bairro).toBeNull()
    expect(r.cidade).toBeNull()
    expect(r.uf).toBeNull()
    expect(r.segundoTelefone).toBeNull()
  })

  it('aceita CEP com ou sem hífen (8 dígitos)', () => {
    expect(clienteSchema.parse({ ...valido, cep: '87010000' }).cep).toBe('87010000')
    expect(clienteSchema.parse({ ...valido, cep: '87010-000' }).cep).toBe('87010000')
  })

  it.each(['1234567', '123456789', '8701000a'])('rejeita CEP inválido (%s)', (cep) => {
    expect(clienteSchema.safeParse({ ...valido, cep }).success).toBe(false)
  })

  it.each(['P', 'PRR', '12'])('rejeita UF que não seja 2 letras (%s)', (uf) => {
    expect(clienteSchema.safeParse({ ...valido, uf }).success).toBe(false)
  })

  it('aceita segundo telefone com máscara e exporta só dígitos', () => {
    const r = clienteSchema.parse({ ...valido, segundoTelefone: '(44) 3333-0000' })
    expect(r.segundoTelefone).toBe('4433330000')
  })

  it('rejeita segundo telefone com dígitos insuficientes', () => {
    expect(clienteSchema.safeParse({ ...valido, segundoTelefone: '4433' }).success).toBe(false)
  })
})
