import { useCallback, useState } from 'react'

/**
 * Endereço retornado pelo ViaCEP, já mapeado para os nomes usados no form
 * (ViaCEP usa `localidade` para a cidade — aqui vira `cidade`).
 */
export interface EnderecoViaCep {
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

/** Resposta crua do ViaCEP; `erro: true` indica CEP inexistente. */
interface ViaCepResponse {
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

export type ResultadoBuscaCep =
  | { status: 'ok'; endereco: EnderecoViaCep }
  | { status: 'nao-encontrado' }
  | { status: 'erro-rede' }

const apenasDigitos = (v: string) => v.replace(/\D/g, '')

/**
 * Consulta o ViaCEP (serviço público, com CORS) para preencher automaticamente
 * o endereço a partir do CEP. Usa `fetch` do browser direto — não passa pelo
 * `@/api/client`, que é a API do AutoCore.
 *
 * Nunca lança: falha de rede vira `{ status: 'erro-rede' }` para o chamador
 * decidir (o cadastro segue com preenchimento manual). CEP inexistente vira
 * `{ status: 'nao-encontrado' }`.
 */
export function useBuscaCep() {
  const [carregando, setCarregando] = useState(false)

  const buscar = useCallback(async (cepBruto: string): Promise<ResultadoBuscaCep> => {
    const cep = apenasDigitos(cepBruto)
    if (cep.length !== 8) return { status: 'nao-encontrado' }

    setCarregando(true)
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      if (!resp.ok) return { status: 'erro-rede' }

      const dados = (await resp.json()) as ViaCepResponse
      if (dados.erro) return { status: 'nao-encontrado' }

      return {
        status: 'ok',
        endereco: {
          logradouro: dados.logradouro ?? '',
          bairro: dados.bairro ?? '',
          cidade: dados.localidade ?? '',
          uf: dados.uf ?? '',
        },
      }
    } catch {
      // Rede indisponível / offline: silencioso, usuário preenche manualmente.
      return { status: 'erro-rede' }
    } finally {
      setCarregando(false)
    }
  }, [])

  return { buscar, carregando }
}
