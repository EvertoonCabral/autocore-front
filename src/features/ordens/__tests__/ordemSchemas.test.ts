import { describe, expect, it } from 'vitest'
import {
  abrirOrdemSchema,
  atualizarOrdemSchema,
  adicionarItemServicoSchema,
  adicionarItemProdutoSchema,
} from '../helpers/ordemSchemas'

describe('abrirOrdemSchema', () => {
  it('aceita clienteId positivo + textos opcionais', () => {
    expect(
      abrirOrdemSchema.safeParse({
        clienteId: 5,
        descricaoProblema: '',
        observacoes: '',
      }).success,
    ).toBe(true)
  })

  it('rejeita clienteId zero/negativo (front força seleção)', () => {
    expect(abrirOrdemSchema.safeParse({ clienteId: 0 }).success).toBe(false)
    expect(abrirOrdemSchema.safeParse({ clienteId: -1 }).success).toBe(false)
  })

  it('rejeita descrição maior que 1000 caracteres', () => {
    expect(
      abrirOrdemSchema.safeParse({ clienteId: 1, descricaoProblema: 'a'.repeat(1001) }).success,
    ).toBe(false)
  })

  it('aceita quilometragem de entrada e coage o número', () => {
    const r = abrirOrdemSchema.parse({ clienteId: 1, quilometragemEntrada: '45000' })
    expect(r.quilometragemEntrada).toBe(45000)
  })

  it('normaliza quilometragem vazia/ausente para null', () => {
    expect(abrirOrdemSchema.parse({ clienteId: 1, quilometragemEntrada: '' }).quilometragemEntrada).toBeNull()
    expect(abrirOrdemSchema.parse({ clienteId: 1 }).quilometragemEntrada).toBeNull()
  })

  it.each([-1, 1.5])('rejeita quilometragem inválida (%s)', (quilometragemEntrada) => {
    expect(abrirOrdemSchema.safeParse({ clienteId: 1, quilometragemEntrada }).success).toBe(false)
  })

  it('agendada=true exige dataAgendamentoInicio', () => {
    expect(abrirOrdemSchema.safeParse({ clienteId: 1, agendada: true }).success).toBe(false)
    expect(
      abrirOrdemSchema.safeParse({
        clienteId: 1,
        agendada: true,
        dataAgendamentoInicio: '2026-08-20T14:30',
      }).success,
    ).toBe(true)
  })

  it('agendada=false/ausente normaliza dataAgendamentoInicio vazio para null', () => {
    const r = abrirOrdemSchema.parse({ clienteId: 1, agendada: false, dataAgendamentoInicio: '' })
    expect(r.agendada).toBe(false)
    expect(r.dataAgendamentoInicio).toBeNull()
    // Campo totalmente ausente permanece undefined (o hook trata como null).
    expect(abrirOrdemSchema.parse({ clienteId: 1 }).dataAgendamentoInicio).toBeUndefined()
  })
})

describe('atualizarOrdemSchema', () => {
  it.each([1, 2, 3])('aceita status %s (não-final)', (status) => {
    expect(
      atualizarOrdemSchema.safeParse({ descricaoProblema: '', observacoes: '', status }).success,
    ).toBe(true)
  })

  it.each([4, 5])('rejeita status %s (final — exige endpoint dedicado)', (status) => {
    expect(
      atualizarOrdemSchema.safeParse({ descricaoProblema: '', observacoes: '', status }).success,
    ).toBe(false)
  })

  it('aceita e coage quilometragem de entrada', () => {
    const r = atualizarOrdemSchema.parse({
      descricaoProblema: '',
      observacoes: '',
      status: 2,
      quilometragemEntrada: '52000',
    })
    expect(r.quilometragemEntrada).toBe(52000)
  })

  it('normaliza quilometragem vazia para null', () => {
    const r = atualizarOrdemSchema.parse({
      descricaoProblema: '',
      observacoes: '',
      status: 1,
      quilometragemEntrada: '',
    })
    expect(r.quilometragemEntrada).toBeNull()
  })

  it('agendada=true exige dataAgendamentoInicio', () => {
    expect(
      atualizarOrdemSchema.safeParse({
        descricaoProblema: '',
        observacoes: '',
        status: 1,
        agendada: true,
      }).success,
    ).toBe(false)
    expect(
      atualizarOrdemSchema.safeParse({
        descricaoProblema: '',
        observacoes: '',
        status: 1,
        agendada: true,
        dataAgendamentoInicio: '2026-08-20T09:00',
      }).success,
    ).toBe(true)
  })

  it('agendada=false normaliza dataAgendamentoInicio vazio para null', () => {
    const r = atualizarOrdemSchema.parse({
      descricaoProblema: '',
      observacoes: '',
      status: 2,
      agendada: false,
      dataAgendamentoInicio: '',
    })
    expect(r.dataAgendamentoInicio).toBeNull()
  })
})

describe('adicionarItemServicoSchema', () => {
  it('aceita catalogoServicoId positivo + quantidade >= 1', () => {
    expect(
      adicionarItemServicoSchema.safeParse({ catalogoServicoId: 7, quantidade: 1 }).success,
    ).toBe(true)
  })

  it('rejeita quantidade zero', () => {
    expect(
      adicionarItemServicoSchema.safeParse({ catalogoServicoId: 7, quantidade: 0 }).success,
    ).toBe(false)
  })
})

describe('adicionarItemProdutoSchema', () => {
  it('aceita modo catalogado (com produtoId)', () => {
    const r = adicionarItemProdutoSchema.safeParse({
      produtoId: 3,
      quantidade: 2,
      produtoFornecidoPeloCliente: false,
    })
    expect(r.success).toBe(true)
  })

  it('aceita modo avulso (sem produtoId, com nome e preço)', () => {
    const r = adicionarItemProdutoSchema.safeParse({
      nomeProduto: 'Lâmpada importada',
      precoUnitario: 25.5,
      quantidade: 1,
      produtoFornecidoPeloCliente: false,
    })
    expect(r.success).toBe(true)
  })

  it('rejeita avulso sem nome', () => {
    const r = adicionarItemProdutoSchema.safeParse({
      precoUnitario: 25,
      quantidade: 1,
      produtoFornecidoPeloCliente: false,
    })
    expect(r.success).toBe(false)
  })

  it('rejeita avulso sem preço', () => {
    const r = adicionarItemProdutoSchema.safeParse({
      nomeProduto: 'Item',
      quantidade: 1,
      produtoFornecidoPeloCliente: false,
    })
    expect(r.success).toBe(false)
  })

  it('rejeita preço negativo', () => {
    const r = adicionarItemProdutoSchema.safeParse({
      nomeProduto: 'Item',
      precoUnitario: -1,
      quantidade: 1,
      produtoFornecidoPeloCliente: false,
    })
    expect(r.success).toBe(false)
  })
})
