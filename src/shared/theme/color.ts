/**
 * Utilitários de cor — usados pelo <AccentProvider> (deriva as CSS vars do
 * accent) e pela aba "Aparência" (validação de contraste WCAG).
 *
 * Implementação manual (sem dependência externa): conversões sRGB ↔ HSL ↔
 * OKLCH, luminância relativa/contraste WCAG 2.x e derivações do accent.
 * OKLCH é usado nas derivações porque manipular *lightness* perceptual (L)
 * dá resultados muito melhores que mexer no L do HSL — clarear o accent
 * escuro para o tema dark, escurecer para hover etc.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}
export interface Oklch {
  L: number
  C: number
  H: number
}

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** `"#RRGGBB"` (ou `#RGB`) → boolean. Aceita com ou sem `#`. */
export function isHexColor(value: string): boolean {
  return HEX_RE.test(value.trim())
}

export function hexToRgb(hex: string): Rgb {
  let h = hex.trim().replace('#', '')
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (x: number) =>
    Math.round(Math.max(0, Math.min(255, x)))
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
}

/** hex → triplet `"H S% L%"` (formato consumido por `hsl(var(--x))`). */
export function hexToHslTriplet(hex: string): string {
  let { r, g, b } = hexToRgb(hex)
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  const round = (x: number) => Math.round(x * 10) / 10
  return `${round(h * 360)} ${round(s * 100)}% ${round(l * 100)}%`
}

// ─── WCAG contraste ─────────────────────────────────────────────────────────

function channelToLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}
function linearToChannel(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return v * 255
}

/** Luminância relativa (WCAG 2.x) de uma cor hex, 0..1. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  )
}

/** Razão de contraste WCAG entre duas cores (1..21). Simétrica. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

/** Fundo do tema usado na validação de contraste da aba Aparência. */
export const THEME_BG = { light: '#FFFFFF', dark: '#131211' } as const

/** true se `cor` atinge a razão mínima (default 4.5:1) contra o fundo do tema. */
export function atendeContrasteMinimo(
  cor: string,
  tema: 'light' | 'dark',
  minimo = 4.5,
): boolean {
  return contrastRatio(cor, THEME_BG[tema]) >= minimo
}

// ─── OKLCH ───────────────────────────────────────────────────────────────────

export function hexToOklch(hex: string): Oklch {
  const { r, g, b } = hexToRgb(hex)
  const lr = channelToLinear(r)
  const lg = channelToLinear(g)
  const lb = channelToLinear(b)
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  const C = Math.sqrt(A * A + B * B)
  let H = (Math.atan2(B, A) * 180) / Math.PI
  if (H < 0) H += 360
  return { L, C, H }
}

export function oklchToHex({ L, C, H }: Oklch): string {
  const hr = (H * Math.PI) / 180
  const A = C * Math.cos(hr)
  const B = C * Math.sin(hr)
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B
  const s_ = L - 0.0894841775 * A - 1.291485548 * B
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return rgbToHex({
    r: linearToChannel(lr),
    g: linearToChannel(lg),
    b: linearToChannel(lb),
  })
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))

/** Deriva o accent do tema escuro clareando o claro ~0.12 em L (OKLCH). */
export function derivarAccentDark(hexLight: string): string {
  const o = hexToOklch(hexLight)
  return oklchToHex({ L: clamp(o.L + 0.12, 0, 1), C: o.C, H: o.H })
}

/**
 * Sugere um tom próximo (mesmo matiz/croma) que atinja o contraste mínimo,
 * escurecendo (light) ou clareando (dark) em passos de L. Devolve o próprio
 * hex se já passa, ou `null` se não achar em faixa razoável.
 */
export function sugerirTomAcessivel(
  hex: string,
  tema: 'light' | 'dark',
  minimo = 4.5,
): string | null {
  if (atendeContrasteMinimo(hex, tema, minimo)) return hex
  const o = hexToOklch(hex)
  const step = tema === 'light' ? -0.02 : 0.02
  for (let i = 1; i <= 40; i++) {
    const L = clamp(o.L + step * i, 0, 1)
    const candidato = oklchToHex({ L, C: o.C, H: o.H })
    if (atendeContrasteMinimo(candidato, tema, minimo)) return candidato
    if (L <= 0 || L >= 1) break
  }
  return null
}

// ─── Derivação das CSS vars do accent ─────────────────────────────────────────

export interface AccentVars {
  primary: string
  primaryForeground: string
  primaryHover: string
  ring: string
  accent: string
  accentForeground: string
  chart1: string
}

const DARK_SURFACE = '#1C1B19'

function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return rgbToHex({
    r: A.r * t + B.r * (1 - t),
    g: A.g * t + B.g * (1 - t),
    b: A.b * t + B.b * (1 - t),
  })
}

/**
 * Deriva todas as CSS vars do accent (como triplets HSL) a partir do hex
 * base, para o tema informado. `on-accent` é fixo por tema (branco no claro,
 * quase-preto no escuro) — garantidamente legível porque o accent salvo já
 * passou pela validação de contraste ≥ 4.5:1.
 */
export function derivarAccentVars(baseHex: string, tema: 'light' | 'dark'): AccentVars {
  const o = hexToOklch(baseHex)
  const hover =
    tema === 'dark'
      ? oklchToHex({ L: clamp(o.L + 0.05, 0, 1), C: o.C, H: o.H })
      : oklchToHex({ L: clamp(o.L - 0.03, 0, 1), C: o.C, H: o.H })
  const soft =
    tema === 'dark'
      ? mix(baseHex, DARK_SURFACE, 0.14)
      : oklchToHex({ L: 0.955, C: Math.min(o.C, 0.03), H: o.H })
  const onSoft =
    tema === 'dark' ? baseHex : oklchToHex({ L: clamp(o.L - 0.06, 0, 1), C: o.C, H: o.H })
  const onAccent = tema === 'dark' ? '#16151A' : '#FFFFFF'

  return {
    primary: hexToHslTriplet(baseHex),
    primaryForeground: hexToHslTriplet(onAccent),
    primaryHover: hexToHslTriplet(hover),
    ring: hexToHslTriplet(baseHex),
    accent: hexToHslTriplet(soft),
    accentForeground: hexToHslTriplet(onSoft),
    chart1: hexToHslTriplet(baseHex),
  }
}

/** Defaults laranja da marca (quando não há accent configurado). */
export const ACCENT_DEFAULTS = { light: '#D75A0B', dark: '#F2792E' } as const

/**
 * Monta o CSS `:root { … } .dark { … }` com as vars do accent para injeção
 * em runtime. `accentLight`/`accentDark` podem ser null:
 *  - ambos null → defaults laranja;
 *  - só dark null → deriva dark do light (OKLCH L+0.12).
 */
export function montarCssAccent(
  accentLight: string | null | undefined,
  accentDark: string | null | undefined,
): string {
  const light =
    accentLight && isHexColor(accentLight) ? accentLight : ACCENT_DEFAULTS.light
  const dark =
    accentDark && isHexColor(accentDark)
      ? accentDark
      : accentLight && isHexColor(accentLight)
        ? derivarAccentDark(accentLight)
        : ACCENT_DEFAULTS.dark

  const vl = derivarAccentVars(light, 'light')
  const vd = derivarAccentVars(dark, 'dark')

  const bloco = (v: AccentVars) => `
    --primary: ${v.primary};
    --primary-foreground: ${v.primaryForeground};
    --primary-hover: ${v.primaryHover};
    --ring: ${v.ring};
    --accent: ${v.accent};
    --accent-foreground: ${v.accentForeground};
    --chart-1: ${v.chart1};
    --brand: ${v.primary};`

  return `:root {${bloco(vl)}\n}\n.dark {${bloco(vd)}\n}\n`
}
