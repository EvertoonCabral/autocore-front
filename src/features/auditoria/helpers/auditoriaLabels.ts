import {
  Ban,
  CheckCircle2,
  CircleDot,
  DollarSign,
  Pencil,
  Plus,
  Star,
  TrashIcon,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import { formatBRL } from '@/lib/format'

/**
 * Valores de `TipoEntidadeAuditavel` espelhando o enum do back
 * (`AutoCore.Domain.Enums.TipoEntidadeAuditavel`).
 */
export const TIPO_ENTIDADE_VALUES = [
  'Cliente',
  'Produto',
  'CatalogoServico',
  'OrdemServico',
] as const
export type TipoEntidadeAuditavel = (typeof TIPO_ENTIDADE_VALUES)[number]

export const TIPO_ENTIDADE_LABEL: Record<string, string> = {
  Cliente: 'Cliente',
  Produto: 'Produto',
  CatalogoServico: 'Serviço',
  OrdemServico: 'Ordem de Serviço',
}

/**
 * Valores de `OperacaoAuditavel` espelhando o enum do back
 * (`AutoCore.Domain.Enums.OperacaoAuditavel`).
 */
export const OPERACAO_VALUES = [
  'Criar',
  'Atualizar',
  'Desativar',
  'AjustarEstoque',
  'AtualizarPreco',
  'DefinirComoPadrao',
  'MudarStatus',
  'Fechar',
  'Cancelar',
] as const
export type OperacaoAuditavel = (typeof OPERACAO_VALUES)[number]

export const OPERACAO_LABEL: Record<string, string> = {
  Criar: 'Criou',
  Atualizar: 'Atualizou',
  Desativar: 'Desativou',
  AjustarEstoque: 'Ajustou estoque',
  AtualizarPreco: 'Atualizou preço',
  DefinirComoPadrao: 'Definiu como padrão',
  MudarStatus: 'Mudou status',
  Fechar: 'Fechou',
  Cancelar: 'Cancelou',
}

export const OPERACAO_ICON: Record<string, LucideIcon> = {
  Criar: Plus,
  Atualizar: Pencil,
  Desativar: TrashIcon,
  AjustarEstoque: Warehouse,
  AtualizarPreco: DollarSign,
  DefinirComoPadrao: Star,
  MudarStatus: CircleDot,
  Fechar: CheckCircle2,
  Cancelar: Ban,
}

const PRECO_REGEX = /^([-+]?\d+(?:\.\d+)?)\s*→\s*([-+]?\d+(?:\.\d+)?)$/

/**
 * Para a operação `AtualizarPreco` o back envia a descrição como
 * `"50.00 → 120.00"`. Converte para BRL preservando a setinha. Para qualquer
 * outra operação devolve a descrição como veio.
 */
export function formatarDescricao(
  operacao: string | null | undefined,
  descricao: string | null | undefined,
): string | null {
  if (!descricao) return null
  if (operacao !== 'AtualizarPreco') return descricao
  const match = descricao.match(PRECO_REGEX)
  if (!match) return descricao
  const de = Number(match[1])
  const para = Number(match[2])
  if (Number.isNaN(de) || Number.isNaN(para)) return descricao
  return `${formatBRL(de)} → ${formatBRL(para)}`
}

export function labelTipoEntidade(tipo: string | null | undefined): string {
  if (!tipo) return '—'
  return TIPO_ENTIDADE_LABEL[tipo] ?? tipo
}

export function labelOperacao(op: string | null | undefined): string {
  if (!op) return '—'
  return OPERACAO_LABEL[op] ?? op
}
