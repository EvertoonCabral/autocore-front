import { describe, expect, it } from 'vitest'
import {
  novoUsuarioSchema,
  editarUsuarioSchema,
} from '../helpers/usuarioSchemas'

describe('novoUsuarioSchema', () => {
  const valido = {
    nomeCompleto: 'Maria Silva',
    email: 'maria@autocore.com',
    senha: 'senha1234',
    role: 'Operador' as const,
  }

  it('aceita payload válido', () => {
    const r = novoUsuarioSchema.safeParse(valido)
    expect(r.success).toBe(true)
  })

  it('faz trim do nome e do email', () => {
    const r = novoUsuarioSchema.safeParse({
      ...valido,
      nomeCompleto: '  Maria Silva  ',
      email: '  Maria@AutoCore.COM  ',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.nomeCompleto).toBe('Maria Silva')
      expect(r.data.email).toBe('maria@autocore.com')
    }
  })

  it.each(['', 'Ab', '  '])('rejeita nome com menos de 3 caracteres ("%s")', (n) => {
    const r = novoUsuarioSchema.safeParse({ ...valido, nomeCompleto: n })
    expect(r.success).toBe(false)
  })

  it('rejeita nome acima de 150 caracteres', () => {
    const r = novoUsuarioSchema.safeParse({
      ...valido,
      nomeCompleto: 'a'.repeat(151),
    })
    expect(r.success).toBe(false)
  })

  it.each(['', 'sem-arroba', 'a@b'])('rejeita email inválido ("%s")', (e) => {
    const r = novoUsuarioSchema.safeParse({ ...valido, email: e })
    expect(r.success).toBe(false)
  })

  it('rejeita email acima de 256 caracteres', () => {
    const long = `${'a'.repeat(255)}@b.com` // 261 chars
    const r = novoUsuarioSchema.safeParse({ ...valido, email: long })
    expect(r.success).toBe(false)
  })

  it.each(['', 'curta', '1234567'])('rejeita senha com menos de 8 caracteres ("%s")', (s) => {
    const r = novoUsuarioSchema.safeParse({ ...valido, senha: s })
    expect(r.success).toBe(false)
  })

  it('rejeita senha acima de 100 caracteres', () => {
    const r = novoUsuarioSchema.safeParse({ ...valido, senha: 'a'.repeat(101) })
    expect(r.success).toBe(false)
  })

  it('rejeita role fora do enum', () => {
    const r = novoUsuarioSchema.safeParse({ ...valido, role: 'SuperAdmin' })
    expect(r.success).toBe(false)
  })

  it('aceita role Admin', () => {
    const r = novoUsuarioSchema.safeParse({ ...valido, role: 'Admin' })
    expect(r.success).toBe(true)
  })
})

describe('editarUsuarioSchema', () => {
  const valido = {
    nomeCompleto: 'Maria Silva',
    ativo: true,
    novaSenha: '',
  }

  it('aceita payload válido com senha vazia (não muda senha)', () => {
    const r = editarUsuarioSchema.safeParse(valido)
    expect(r.success).toBe(true)
  })

  it('aceita payload sem novaSenha (opcional)', () => {
    const r = editarUsuarioSchema.safeParse({
      nomeCompleto: valido.nomeCompleto,
      ativo: valido.ativo,
    })
    expect(r.success).toBe(true)
  })

  it('aceita senha preenchida com >= 8 caracteres', () => {
    const r = editarUsuarioSchema.safeParse({ ...valido, novaSenha: 'senha1234' })
    expect(r.success).toBe(true)
  })

  it.each(['a', '1234567'])(
    'rejeita senha preenchida com menos de 8 caracteres ("%s")',
    (s) => {
      const r = editarUsuarioSchema.safeParse({ ...valido, novaSenha: s })
      expect(r.success).toBe(false)
    },
  )

  it('rejeita senha acima de 100 caracteres', () => {
    const r = editarUsuarioSchema.safeParse({ ...valido, novaSenha: 'a'.repeat(101) })
    expect(r.success).toBe(false)
  })

  it('faz trim do nome', () => {
    const r = editarUsuarioSchema.safeParse({ ...valido, nomeCompleto: '  João  ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.nomeCompleto).toBe('João')
  })

  it.each(['', 'Ab'])('rejeita nome curto ("%s")', (n) => {
    const r = editarUsuarioSchema.safeParse({ ...valido, nomeCompleto: n })
    expect(r.success).toBe(false)
  })

  it('exige ativo como boolean', () => {
    const r = editarUsuarioSchema.safeParse({ ...valido, ativo: 'sim' as unknown as boolean })
    expect(r.success).toBe(false)
  })
})
