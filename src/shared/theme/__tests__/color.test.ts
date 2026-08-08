import { describe, expect, it } from 'vitest'
import {
  atendeContrasteMinimo,
  contrastRatio,
  derivarAccentDark,
  derivarAccentVars,
  hexToHslTriplet,
  hexToOklch,
  isHexColor,
  montarCssAccent,
  oklchToHex,
  sugerirTomAcessivel,
} from '../color'

describe('isHexColor', () => {
  it('aceita #RRGGBB e #RGB, com ou sem #', () => {
    expect(isHexColor('#D75A0B')).toBe(true)
    expect(isHexColor('D75A0B')).toBe(true)
    expect(isHexColor('#abc')).toBe(true)
  })
  it('rejeita valores inválidos', () => {
    expect(isHexColor('#12')).toBe(false)
    expect(isHexColor('rgb(0,0,0)')).toBe(false)
    expect(isHexColor('#GGGGGG')).toBe(false)
  })
})

describe('contrastRatio', () => {
  it('preto vs branco é ~21:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
  })
  it('é simétrica', () => {
    expect(contrastRatio('#1F5F8B', '#FFFFFF')).toBeCloseTo(
      contrastRatio('#FFFFFF', '#1F5F8B'),
      5,
    )
  })
})

describe('atendeContrasteMinimo', () => {
  it('aprova uma cor com contraste suficiente contra o fundo do tema', () => {
    // #1F5F8B contra branco ~6.8:1 → passa 4.5:1
    expect(atendeContrasteMinimo('#1F5F8B', 'light')).toBe(true)
    // #F2792E contra #131211 ~6.7:1 → passa no escuro
    expect(atendeContrasteMinimo('#F2792E', 'dark')).toBe(true)
  })
  it('reprova uma cor com contraste ruim', () => {
    // Bege claro contra branco → contraste baixíssimo
    expect(atendeContrasteMinimo('#F5E9DC', 'light')).toBe(false)
    // Cinza escuro contra fundo escuro → falha
    expect(atendeContrasteMinimo('#2A2724', 'dark')).toBe(false)
  })
})

describe('OKLCH round-trip', () => {
  it('hex → oklch → hex preserva a cor (tolerância 1)', () => {
    for (const hex of ['#D75A0B', '#1F5F8B', '#2C6E49', '#FFFFFF', '#131211']) {
      const back = oklchToHex(hexToOklch(hex))
      const a = parseInt(hex.slice(1), 16)
      const b = parseInt(back.slice(1), 16)
      const dr = Math.abs(((a >> 16) & 255) - ((b >> 16) & 255))
      const dg = Math.abs(((a >> 8) & 255) - ((b >> 8) & 255))
      const db = Math.abs((a & 255) - (b & 255))
      expect(Math.max(dr, dg, db)).toBeLessThanOrEqual(2)
    }
  })
})

describe('derivarAccentDark', () => {
  it('clareia o accent (L maior) mantendo hex válido', () => {
    const dark = derivarAccentDark('#9A3412')
    expect(isHexColor(dark)).toBe(true)
    expect(hexToOklch(dark).L).toBeGreaterThan(hexToOklch('#9A3412').L)
  })
})

describe('sugerirTomAcessivel', () => {
  it('devolve a própria cor se já passa', () => {
    expect(sugerirTomAcessivel('#1F5F8B', 'light')).toBe('#1F5F8B')
  })
  it('sugere um tom que atinge o mínimo quando a cor falha', () => {
    const sugestao = sugerirTomAcessivel('#F5E9DC', 'light')
    expect(sugestao).not.toBeNull()
    expect(atendeContrasteMinimo(sugestao as string, 'light')).toBe(true)
  })
})

describe('derivarAccentVars', () => {
  it('on-accent é branco no claro e quase-preto no escuro', () => {
    expect(derivarAccentVars('#D75A0B', 'light').primaryForeground).toBe('0 0% 100%')
    expect(derivarAccentVars('#F2792E', 'dark').primaryForeground).toBe(
      hexToHslTriplet('#16151A'),
    )
  })
})

describe('montarCssAccent', () => {
  it('gera escopos :root e .dark com o accent informado', () => {
    const css = montarCssAccent('#1F5F8B', null)
    expect(css).toContain(':root {')
    expect(css).toContain('.dark {')
    // --primary do claro = triplet de #1F5F8B
    expect(css).toContain(`--primary: ${hexToHslTriplet('#1F5F8B')}`)
  })
  it('usa defaults laranja quando ambos são null', () => {
    const css = montarCssAccent(null, null)
    expect(css).toContain(`--primary: ${hexToHslTriplet('#D75A0B')}`)
  })
})
