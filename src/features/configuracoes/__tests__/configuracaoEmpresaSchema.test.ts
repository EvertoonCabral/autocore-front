import { describe, expect, it } from 'vitest'
import {
  MIME_LOGO_PERMITIDOS,
  TAMANHO_MAX_LOGO_BYTES,
  nomeEmpresaSchema,
  validarArquivoLogo,
} from '../helpers/configuracaoEmpresaSchema'

function makeFile(name: string, type: string, sizeBytes: number): File {
  // Constrói um File com tamanho controlado sem alocar o buffer inteiro:
  // um Blob com `size` calculado via getter mockado seria ainda mais barato,
  // mas para 2-3 MB é trivial.
  const buffer = new Uint8Array(sizeBytes)
  return new File([buffer], name, { type })
}

describe('nomeEmpresaSchema', () => {
  it('aceita nome válido', () => {
    const r = nomeEmpresaSchema.safeParse({ nomeEmpresa: 'Auto Elétrica Central' })
    expect(r.success).toBe(true)
  })

  it('faz trim', () => {
    const r = nomeEmpresaSchema.safeParse({ nomeEmpresa: '  Auto  ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.nomeEmpresa).toBe('Auto')
  })

  it('rejeita nome vazio', () => {
    expect(nomeEmpresaSchema.safeParse({ nomeEmpresa: '' }).success).toBe(false)
  })

  it('rejeita nome só com espaços (vira vazio após trim)', () => {
    expect(nomeEmpresaSchema.safeParse({ nomeEmpresa: '   ' }).success).toBe(false)
  })

  it('rejeita nome com mais de 150 caracteres', () => {
    expect(
      nomeEmpresaSchema.safeParse({ nomeEmpresa: 'a'.repeat(151) }).success,
    ).toBe(false)
  })

  it('aceita exatamente 150 caracteres', () => {
    expect(
      nomeEmpresaSchema.safeParse({ nomeEmpresa: 'a'.repeat(150) }).success,
    ).toBe(true)
  })
})

describe('validarArquivoLogo', () => {
  it('aceita PNG dentro do limite', () => {
    const r = validarArquivoLogo(makeFile('logo.png', 'image/png', 100_000))
    expect(r.ok).toBe(true)
  })

  it('aceita JPEG dentro do limite', () => {
    const r = validarArquivoLogo(makeFile('logo.jpg', 'image/jpeg', 100_000))
    expect(r.ok).toBe(true)
  })

  it('aceita WebP dentro do limite', () => {
    const r = validarArquivoLogo(makeFile('logo.webp', 'image/webp', 100_000))
    expect(r.ok).toBe(true)
  })

  it('rejeita formato não suportado (PDF)', () => {
    const r = validarArquivoLogo(makeFile('logo.pdf', 'application/pdf', 100_000))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erro).toMatch(/formato não suportado/i)
  })

  it('rejeita GIF', () => {
    const r = validarArquivoLogo(makeFile('logo.gif', 'image/gif', 100_000))
    expect(r.ok).toBe(false)
  })

  it('rejeita arquivo acima de 2 MB', () => {
    const r = validarArquivoLogo(
      makeFile('logo.png', 'image/png', TAMANHO_MAX_LOGO_BYTES + 1),
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erro).toMatch(/máximo: 2 mb/i)
  })

  it('aceita arquivo exatamente no limite (2 MB)', () => {
    const r = validarArquivoLogo(
      makeFile('logo.png', 'image/png', TAMANHO_MAX_LOGO_BYTES),
    )
    expect(r.ok).toBe(true)
  })

  it('MIMEs permitidos contém PNG/JPEG/WebP', () => {
    expect(MIME_LOGO_PERMITIDOS).toEqual(['image/png', 'image/jpeg', 'image/webp'])
  })
})
