import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Telefone PT-BR: 5544999990000 → "(44) 99999-0000". Aceita formato com ou sem DDI. */
export function formatTelefone(value: string | null | undefined): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  let local = digits
  if (digits.length === 12 || digits.length === 13) {
    // tem DDI 55 — descarta para exibir no formato local
    local = digits.startsWith('55') ? digits.slice(2) : digits
  }
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  return value
}

/** CPF: "12345678901" → "123.456.789-01". */
export function formatCpf(value: string | null | undefined): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return value
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/** CNPJ: "12345678000190" → "12.345.678/0001-90". */
export function formatCnpj(value: string | null | undefined): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 14) return value
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

/**
 * Detecta automaticamente CPF (11 dígitos) ou CNPJ (14 dígitos) e formata.
 * Para entradas parciais, devolve o valor mascarado progressivamente — útil
 * para `onChange` de input.
 */
export function formatCpfCnpj(value: string | null | undefined): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    // CPF progressivo
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }
  // CNPJ progressivo (12..14 dígitos)
  const base = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}`
  if (digits.length === 12) return base
  return `${base}-${digits.slice(12)}`
}

/**
 * Aplica máscara de telefone PT-BR progressivamente conforme o usuário digita.
 * 10 dígitos → `(44) 9999-0000`; 11 dígitos → `(44) 99999-0000`.
 * Aceita até 11 dígitos locais (DDI 55 é stripado se vier).
 */
export function maskTelefoneInput(value: string | null | undefined): string {
  if (!value) return ''
  let digits = value.replace(/\D/g, '')
  // Strip DDI 55 se vier prefixado
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2)
  digits = digits.slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** Moeda BRL: 51.25 → "R$ 51,25". */
export function formatBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/** Data ISO-8601 UTC → "06/05/2026 14:32". */
export function formatDataHora(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch {
    return iso
  }
}

/** Data ISO-8601 UTC → "06/05/2026". */
export function formatData(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return iso
  }
}

/** Remove caracteres não-numéricos — útil ao submeter form (telefone/CPF). */
export function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

/**
 * Quantos dias se passaram desde `iso` até hoje (UTC). Retorna número
 * positivo se a data já passou (atraso), 0 se é hoje, negativo se futura.
 * Retorna `null` se a data for inválida ou ausente.
 *
 * Útil para badges de aging (ex.: "Atrasada >30d" em pendências).
 */
export function diasDesde(iso: string | null | undefined): number | null {
  if (!iso) return null
  try {
    const data = parseISO(iso)
    if (isNaN(data.getTime())) return null
    const hoje = new Date()
    // Compara em UTC truncado para dia (evita variação por hora do dia)
    const msPorDia = 24 * 60 * 60 * 1000
    const dataUtc = Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())
    const hojeUtc = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate())
    return Math.floor((hojeUtc - dataUtc) / msPorDia)
  } catch {
    return null
  }
}
