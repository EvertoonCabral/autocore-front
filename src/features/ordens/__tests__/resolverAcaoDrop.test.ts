import { describe, expect, it } from 'vitest'
import { resolverAcaoDrop } from '../lib/resolverAcaoDrop'
import { StatusOrdemValues } from '@/shared/enums/statusOrdem'

const { Aberta, EmAndamento, AguardandoProduto, Concluida, Cancelada } = StatusOrdemValues

describe('resolverAcaoDrop', () => {
  it('mesma coluna → noop', () => {
    expect(resolverAcaoDrop(Aberta, Aberta)).toBe('noop')
    expect(resolverAcaoDrop(EmAndamento, EmAndamento)).toBe('noop')
  })

  it('entre etapas não-terminais → mudar', () => {
    expect(resolverAcaoDrop(Aberta, EmAndamento)).toBe('mudar')
    expect(resolverAcaoDrop(EmAndamento, AguardandoProduto)).toBe('mudar')
    expect(resolverAcaoDrop(AguardandoProduto, Aberta)).toBe('mudar')
  })

  it('destino Concluída → fechar', () => {
    expect(resolverAcaoDrop(Aberta, Concluida)).toBe('fechar')
    expect(resolverAcaoDrop(EmAndamento, Concluida)).toBe('fechar')
    expect(resolverAcaoDrop(AguardandoProduto, Concluida)).toBe('fechar')
  })

  it('origem terminal (Concluída/Cancelada) → noop', () => {
    expect(resolverAcaoDrop(Concluida, Aberta)).toBe('noop')
    expect(resolverAcaoDrop(Cancelada, EmAndamento)).toBe('noop')
  })

  it('destino Cancelada (sem coluna) → noop', () => {
    expect(resolverAcaoDrop(Aberta, Cancelada)).toBe('noop')
  })
})
