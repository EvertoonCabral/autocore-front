import { describe, expect, it } from 'vitest'
import {
  STATUS_ORDEM_META,
  STATUS_ORDEM_OPTIONS,
  STATUS_EDITAVEIS_OPTIONS,
  StatusOrdemValues,
  podeEditarItens,
  podeFechar,
  podeCancelar,
  podeMudarStatus,
} from '../statusOrdem'

describe('StatusOrdem — metadados', () => {
  it('cobre os 5 status da enum do back', () => {
    const ids = Object.values(StatusOrdemValues)
    for (const id of ids) {
      expect(STATUS_ORDEM_META[id]).toBeDefined()
      expect(STATUS_ORDEM_META[id].label).toBeTruthy()
      expect(STATUS_ORDEM_META[id].badgeClass).toContain('bg-')
    }
  })

  it('expõe 5 opções para o filtro de listagem', () => {
    expect(STATUS_ORDEM_OPTIONS).toHaveLength(5)
  })

  it('expõe apenas os 3 status não-finais para edição', () => {
    expect(STATUS_EDITAVEIS_OPTIONS.map((o) => o.value)).toEqual([1, 2, 3])
  })
})

describe('podeEditarItens', () => {
  it('libera para Aberta e EmAndamento', () => {
    expect(podeEditarItens(1)).toBe(true)
    expect(podeEditarItens(2)).toBe(true)
  })

  it('bloqueia para AguardandoProduto, Concluida e Cancelada', () => {
    expect(podeEditarItens(3)).toBe(false)
    expect(podeEditarItens(4)).toBe(false)
    expect(podeEditarItens(5)).toBe(false)
  })

  it('bloqueia quando status é null/undefined', () => {
    expect(podeEditarItens(null)).toBe(false)
    expect(podeEditarItens(undefined)).toBe(false)
  })
})

describe('podeFechar', () => {
  it('libera para Aberta, EmAndamento e AguardandoProduto', () => {
    expect(podeFechar(1)).toBe(true)
    expect(podeFechar(2)).toBe(true)
    expect(podeFechar(3)).toBe(true)
  })

  it('bloqueia para Concluida e Cancelada (estados finais)', () => {
    expect(podeFechar(4)).toBe(false)
    expect(podeFechar(5)).toBe(false)
  })
})

describe('podeCancelar', () => {
  it('libera para 1, 2 e 3 (front nao tem visibilidade de pagamentos)', () => {
    expect(podeCancelar(1)).toBe(true)
    expect(podeCancelar(2)).toBe(true)
    expect(podeCancelar(3)).toBe(true)
  })

  it('bloqueia para Concluida e Cancelada — back que decide se permite', () => {
    expect(podeCancelar(4)).toBe(false)
    expect(podeCancelar(5)).toBe(false)
  })
})

describe('podeMudarStatus (PUT)', () => {
  it('estados finais nao podem ser alterados via PUT', () => {
    expect(podeMudarStatus(4, 1)).toBe(false)
    expect(podeMudarStatus(5, 1)).toBe(false)
  })

  it('Concluida e Cancelada exigem endpoints dedicados (fechar/cancelar)', () => {
    expect(podeMudarStatus(1, 4)).toBe(false)
    expect(podeMudarStatus(2, 5)).toBe(false)
  })

  it('libera transicoes entre 1, 2 e 3', () => {
    expect(podeMudarStatus(1, 2)).toBe(true)
    expect(podeMudarStatus(2, 3)).toBe(true)
    expect(podeMudarStatus(3, 1)).toBe(true)
  })
})
