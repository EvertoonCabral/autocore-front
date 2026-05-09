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
