# Plano de implementação — Pagamentos via Mercado Pago

> **Status:** proposta (não implementado)
> **Escopo:** back (`../AutoCore/`) + front (`autocore-front`)
> **Data:** 2026-08-10 · **Revisão 2** (decisões de risco 1–5 incorporadas)

Objetivo em uma frase: **cobrar o cliente na bancada com QR Pix na tela e mandar a
cobrança (PDF do orçamento/OS + link de crédito/Pix) por WhatsApp/e-mail**, com o
pagamento caindo automaticamente na OS quando o Mercado Pago confirmar.

---

## 1. Decisões tomadas

| # | Decisão | Escolha |
|---|---|---|
| 1 | Produtos MP | **Pix QR dinâmico** (`POST /v1/payments`, `payment_method_id=pix`) para a bancada + **Checkout Pro** (`POST /checkout/preferences`) para o link com crédito/débito/Pix/boleto. Point (maquininha) fora de escopo. |
| 2 | Pagamento antes de concluir a OS | Regra atual **preservada** (`pagamentos.md`: pagamento só em OS `Concluida`). Cria-se a modalidade explícita **Adiantamento**: o atendente opta deliberadamente, o valor fica como adiantamento aprovado e é **convertido em `Pagamento` no fechamento da OS**. |
| 3 | Entrega do PDF | **Anexo real**: WhatsApp via Evolution `/message/sendMedia` (PDF em base64) + e-mail com anexo. Sem endpoint público/anônimo de download. |
| 4 | Excedente de adiantamento | **Aviso em tela + reembolso manual pelo Admin**, com registro em auditoria. Nada de crédito automático para OS futura. |
| 5 | Taxa do Mercado Pago | **Repassada ao cliente.** O cliente paga `valor da OS + acréscimo`; a OS recebe só o valor base. Ver § 4.6 — é a decisão com mais consequências. |
| 6 | Cliente sem CPF/CNPJ | **Bloqueia a cobrança online.** CPF/CNPJ obrigatório para gerar QR ou link (segue opcional no cadastro geral). |
| 7 | Cancelar OS com adiantamento | Guard novo: exige reembolso antes. Sequência completa mapeada na auditoria. |
| 8 | Validade do Pix | Bancada com **timer na tela**; Pix enviado ao cliente **declara a validade na mensagem** (placeholder alimentado pela config, sem chance de divergir). Geração e envio **geram auditoria**. |

Consequência da decisão 2: **nenhuma regra canônica do back é contrariada**.
`OrdemServico.RegistrarPagamento` continua exigindo `Concluida`; o adiantamento é
conceito novo, com tabela própria, que *desagua* em `Pagamento`.

---

## 2. O que já existe (e será reaproveitado)

| Peça | Onde | Reaproveitamento |
|---|---|---|
| Config singleton cifrada com `IDataProtector` | `ConfiguracaoCobranca` + `DataProtectorCifradorSegredos` + `ICifradorSegredos` | Molde exato da nova `ConfiguracaoPagamento` |
| Aba de config com password mascarado + card de status + "Testar conexão" | `ConfiguracaoCobrancaTab`, `StatusConexaoCard` | Molde da aba "Mercado Pago" |
| Cliente HTTP com retry e classificação de erro transitório | `WhatsAppService` (3x, backoff, `EhStatusTransitorio`) | Molde do `MercadoPagoClient` |
| Stub controlado por flag no banco | `WhatsAppService.UsarStub` | Molde do stub do MP (QR falso + aprovação simulada) |
| Geração de PDF da OS | `IOrdemServicoPdfService` (QuestPDF) + `GET /api/ordens/{id}/pdf?tipo=` | Ganha campos opcionais de link/QR/acréscimo |
| Envio + histórico + idempotência diária | `CobrancaJobService`, `HistoricoCobranca` | Novo caso de uso de envio com anexo reusa histórico e normalização de telefone |
| Job recorrente Hangfire | `RecurringJob.AddOrUpdate<ICobrancaJobService>` | Molde do job de reconciliação |
| **Auditoria por strings** | `TipoEntidadeAuditavel` / `OperacaoAuditavel` (constantes `const string`) | **Novas operações não exigem migration.** Ancorando tudo em `TipoEntidadeAuditavel.OrdemServico`, o ciclo de vida da cobrança online aparece de graça no `<AuditoriaTimeline>` da `OrdemDetalhePage` |
| `cpfCnpj` já validado (11/14 dígitos) | `clientes/helpers/clienteSchema.ts` | Base do gate de CPF (§ 4.7) |
| Front: `fetch` cru + `notificarNaoAutorizado()` | `useBaixarPdfOrdemServico` | Padrão para respostas binárias |

---

## 3. Modelo de dados (back)

### 3.1 `intencao_pagamento` (nova entidade `IntencaoPagamento`)

Uma linha por tentativa de cobrança online (QR gerado ou link gerado).

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | long | |
| `OrdemServicoId` | long | FK |
| `Provedor` | enum `ProvedorPagamento` | `MercadoPago = 1` (porta aberta) |
| `Tipo` | enum `TipoIntencaoPagamento` | `PixQr = 1`, `LinkCheckout = 2` |
| `Modalidade` | enum `ModalidadeCobranca` | `Quitacao = 1`, `Adiantamento = 2` |
| `Origem` | enum `OrigemCobranca` | `Bancada = 1`, `Remota = 2` — define qual validade de Pix usar |
| **`ValorBase`** | decimal | o que quita a OS. **É este valor que vira `Pagamento`** |
| **`TaxaPercentualAplicada`** | decimal | snapshot da taxa vigente no momento (taxa muda; o histórico não pode mudar com ela) |
| **`ValorAcrescimo`** | decimal | repasse da taxa. **Nunca entra no total da OS** |
| **`ValorCobrado`** | decimal | `ValorBase + ValorAcrescimo` — é o `transaction_amount` enviado ao MP |
| `Status` | enum `StatusIntencaoPagamento` | `Pendente=1`, `Aprovada=2`, `Recusada=3`, `Expirada=4`, `Cancelada=5`, `Reembolsada=6` |
| `IdExterno` | string(64) | `payment.id` (Pix) ou `preference.id` (link) — **índice único** por provedor |
| `IdPagamentoExterno` | string(64)? | preenchido quando a preference converte em payment |
| `ReferenciaExterna` | string(80) | `external_reference` = `{Numero}-{Id}` — **único** |
| `PixCopiaECola` | string(2000)? | payload EMV (`qr_code`) |
| `UrlCheckout` | string(500)? | `init_point` |
| `ExpiraEm` | timestamptz? | `date_of_expiration` |
| `PagamentoId` | long? | preenchido quando vira `Pagamento` — **é isto que marca "já convertido"** |
| `ValorExcedente` | decimal? | sobra do adiantamento não aplicável à OS (§ 4.5) |
| `FormaDetectada` | enum `FormaPagamento`? | mapeado do `payment_method_id` |
| `TaxaGatewayReal` | decimal? | `fee_details` — a taxa que o MP **de fato** cobrou |
| `ValorLiquido` | decimal? | `net_received_amount` — usado para conferir se o repasse cobriu (§ 4.6) |
| `MotivoRecusa` | string(300)? | `status_detail` traduzido |
| Auditoria | — | `CriadoEm/Por`, `AtualizadoEm/Por` (padrão do projeto) |

Métodos: `MarcarAprovada(...)`, `MarcarRecusada(motivo)`, `MarcarExpirada()`,
`Cancelar(usuario)`, `MarcarReembolsada(usuario)`, `VincularPagamento(pagamentoId)`,
`RegistrarExcedente(valor)`. Transições ilegais lançam `RegraNegocioException`
(guards na entidade, como no resto do domínio).

Invariantes a cobrir com teste:
- `ValorCobrado == ValorBase + ValorAcrescimo` (sempre)
- `PagamentoId` só pode ser setado **uma vez**
- `Pagamento.Valor == ValorBase` (nunca `ValorCobrado`)

> **Não persistir o PNG do QR.** Guardamos só o texto EMV; o front renderiza
> (`qrcode.react`) e o PDF gera via `QRCoder`. Evita blob de ~15 KB por linha.

### 3.2 `webhook_evento_pagamento` (idempotência)

`Provedor` + `Tipo` + `EventoId` com **índice único composto** (o MP reentrega o
mesmo evento), mais `RecebidoEm`, `Processado`, `Erro`, `PayloadHash`
(via `IHasherConteudo`, que já existe).

### 3.3 `configuracao_pagamento` (singleton, `Id = 1`)

| Campo | Default | Notas |
|---|---|---|
| `AccessTokenCifrado` | — | `IDataProtector`. **Nunca** em DTO |
| `PublicKey` | — | pode ir ao front (hoje sem uso) |
| `WebhookSecretCifrado` | — | secret da assinatura, do painel MP |
| `Ambiente` | `Sandbox` | enum `AmbientePagamento` |
| `UsarStub` | **`true`** | mesmo default seguro da cobrança WhatsApp |
| `PixExpiraMinutosBancada` | `30` | alimenta o timer da tela |
| `PixExpiraMinutosRemoto` | `30` | Pix enviado por WhatsApp/e-mail — ver risco #5 em § 10 |
| `BaseUrlPublica` | — | `notification_url` e `back_urls` |
| `EmailFallbackPagador` | — | `payer.email` quando o cliente não tem e-mail |
| **`RepassarTaxa`** | **`true`** | decisão 5 |
| **`TaxaPixPercentual`** | `0,99` | taxa **negociada da conta** — o MP não expõe isso por API |
| **`TaxaCartaoPercentual`** | `4,98` | idem; varia com prazo de recebimento |
| **`JurosParcelamentoAoCliente`** | `true` | no Checkout Pro, quem absorve os juros das parcelas |
| `ParcelasMaximas` | `12` | |
| `BoletoHabilitado` | `false` | |
| Auditoria | — | padrão do projeto |

> As taxas são **digitadas**, não descobertas: o Mercado Pago não expõe a taxa
> negociada da conta por API. A aba de config avisa isso e o job de reconciliação
> denuncia quando a taxa configurada não bate com a real (§ 4.6).

### 3.4 Alterações em entidades existentes

**`OrdemServico`**
- Nav `ICollection<IntencaoPagamento> IntencoesPagamento`
- `decimal TotalAdiantado => IntencoesPagamento.Where(i => i.Status == Aprovada && i.PagamentoId == null).Sum(i => i.ValorBase)`
- `decimal SaldoAPagar => SaldoDevedor - TotalAdiantado`
- `Cancelar()` ganha guard: **não cancela com adiantamento aprovado não reembolsado**
  → "Reembolse os adiantamentos antes de cancelar" (simétrico ao guard de pagamentos que já existe)

**`HistoricoCobranca`**
- `IntencaoPagamentoId` (long?) — liga a mensagem ao link que ela carregava
- `ComAnexo` (bool)

**`configuracoes` (chave/valor)** — nova chave na whitelist:
`MensagemCobrancaOnline`, com os placeholders de hoje mais
**`{LinkPagamento}`**, **`{PixCopiaECola}`**, **`{Validade}`**,
**`{ValorCobrado}`**, **`{Acrescimo}`**.
Validador: se o template contém `{PixCopiaECola}`, **é obrigatório** conter
`{Validade}` (422 caso contrário) — decisão 8 virando regra executável.

### 3.5 Auditoria — novas constantes (sem migration)

Em `OperacaoAuditavel`, todas ancoradas em `TipoEntidadeAuditavel.OrdemServico`:

| Constante | Quando | Descrição gravada |
|---|---|---|
| `GerarCobrancaOnline` | QR Pix ou link gerado | tipo, modalidade, origem, `ValorBase` + acréscimo, validade |
| `EnviarCobranca` | mensagem despachada | canal, com/sem anexo, tipo do PDF |
| `ConfirmarPagamentoOnline` | webhook/reconciliação aprovou | `IdExterno`, forma, `ValorBase`, líquido recebido |
| `CancelarCobrancaOnline` | recusa, expiração ou cancelamento manual | motivo |
| `ConverterAdiantamento` | adiantamento virou `Pagamento` no fechamento | valor aplicado |
| `RegistrarExcedenteAdiantamento` | sobra detectada no fechamento | valor a devolver |
| `ReembolsarPagamento` | reembolso via MP (Admin) | valor, se foi total ou parcial |

Ganho de projeto: como tudo ancora em `OrdemServico`, o ciclo completo aparece no
`<AuditoriaTimeline>` da `OrdemDetalhePage` **sem UI nova**. E o caso da decisão 7
fica reconstruível pela sequência `ReembolsarPagamento` → `Cancelar` na mesma OS.

---

## 4. Camada de integração e regras (back)

### 4.1 `IMercadoPagoClient`

```csharp
Task<ResultadoPix>          CriarPagamentoPixAsync(CriarPixArgs a, CancellationToken ct);
Task<ResultadoPreferencia>  CriarPreferenciaAsync(CriarPreferenciaArgs a, CancellationToken ct);
Task<PagamentoGateway?>     ObterPagamentoAsync(string idExterno, CancellationToken ct);
Task<PagamentoGateway?>     BuscarPorReferenciaAsync(string referenciaExterna, CancellationToken ct);
Task<ResultadoReembolso>    ReembolsarAsync(string idPagamento, decimal? valor, CancellationToken ct);
```

`MercadoPagoClient` em `Infra/Services/MercadoPago/`:
- Lê `ConfiguracaoPagamento` **a cada chamada** (troca pela UI vale na hora) — igual `EvolutionApiClient`
- `HttpClient` nomeado `"MercadoPago"`, base `https://api.mercadopago.com`, timeout 30s
- `Authorization: Bearer {token}` + **`X-Idempotency-Key`** (GUID da intenção) nos POSTs
- Retry 3x com backoff só em 5xx/408/429 (lógica de `WhatsAppService`)
- **Não propaga exceção**: devolve `Sucesso=false` + mensagem
- `MercadoPagoClientStub` quando `UsarStub = true`: EMV falso, `IdExterno` sintético,
  aprovação após ~10s → o fluxo inteiro do front testável sem conta MP e sem túnel

Payload Pix essencial:
```
transaction_amount: ValorCobrado, description, payment_method_id: "pix",
external_reference, date_of_expiration,
notification_url: {BaseUrlPublica}/api/webhooks/mercadopago,
payer: { email, first_name, last_name, identification: { type: "CPF"|"CNPJ", number } }
```
→ resposta em `point_of_interaction.transaction_data.qr_code` (EMV) e `qr_code_base64`.

### 4.2 Webhook — `POST /api/webhooks/mercadopago`

- **`[AllowAnonymous]`** (server-to-server; `Program.cs` já tem precedente em health)
- Valida **`x-signature`**: manifest `id:{data.id};request-id:{x-request-id};ts:{ts};`
  → HMAC-SHA256 com `WebhookSecret`, comparação em tempo constante. Inválida → **401**
- **Nunca confia no corpo**: usa só `data.id` e re-consulta `GET /v1/payments/{id}`
- Idempotência via `webhook_evento_pagamento` (índice único) — reentrega vira no-op
- Responde **200 rápido**; falha ao consultar o MP → 5xx para o MP reentregar
- Fora da política CORS `"Frontend"`, com limite de tamanho de corpo

### 4.3 `AplicarStatusGatewayHandler` — um caminho só

Chamado pelo webhook **e** pelo job de reconciliação, para o resultado ser idêntico:

```
1. carrega a intenção por IdExterno / ReferenciaExterna
2. se já terminal e igual ao novo status → no-op
3. mapeia: approved→Aprovada · rejected→Recusada · cancelled→Cancelada
           refunded/charged_back→Reembolsada · pending/in_process→Pendente
4. se Aprovada:
   a. OS Concluida → ordem.RegistrarPagamento(ValorBase, formaDetectada, "MP {id}")
                     + intencao.VincularPagamento(pagamento.Id)
   b. OS não concluída (Adiantamento) → fica Aprovada com PagamentoId = null
5. audita (§ 3.5) e salva em UMA transação
```

Duas regras que evitam perder dinheiro:

- **`Aprovada` vence `Expirada` local.** Se o banco liquidar depois do prazo e o MP
  disser `approved`, a intenção marcada `Expirada` **é reaberta** e o pagamento
  registrado. Tratar `Expirada` como terminal contra um `approved` significaria
  dinheiro na conta do MP e OS em aberto.
- **Pagamento = `ValorBase`, nunca `ValorCobrado`.** Registrar o valor cobrado
  estouraria `SaldoDevedor` e `RegistrarPagamento` lançaria exceção — o pagamento
  do cliente ficaria órfão. Esta é a armadilha central da decisão 5.

Corrida a evitar: duas confirmações simultâneas do mesmo pagamento. Proteção =
índice único em `IdExterno` + `PagamentoId` setável uma só vez + transação. Merece
teste de concorrência.

### 4.4 Conversão do adiantamento no fechamento

`FecharOrdemServicoHandler`, **depois** de `ordem.Fechar(dias, user)`:

```
para cada intenção Aprovada com PagamentoId == null (mais antiga primeiro):
    valorAplicavel = min(intencao.ValorBase, ordem.SaldoDevedor)
    se valorAplicavel > 0 → ordem.RegistrarPagamento(...) + VincularPagamento
                            + auditoria ConverterAdiantamento
    se intencao.ValorBase > valorAplicavel
        → intencao.RegistrarExcedente(sobra)
          + auditoria RegistrarExcedenteAdiantamento
```

- A ordem importa: `Fechar` primeiro (vira `Concluida`), aí `RegistrarPagamento` é legal
- Adiantamentos cobrindo o total → OS fecha **quitada** e não entra no job de cobrança

### 4.5 Excedente (decisão 4)

Sem crédito automático, sem devolução automática:
- `ValorExcedente` fica gravado na intenção
- `OrdemDetalhePage` e `PendenciasPage` exibem alerta persistente
  **"R$ X a devolver ao cliente"** (não é um toast — precisa sobreviver ao refresh)
- Reembolso é ação **manual do Admin** em `POST /api/cobranca-online/{id}/reembolso`
  (parcial, com o valor do excedente pré-preenchido)
- Auditoria: `RegistrarExcedenteAdiantamento` na detecção, `ReembolsarPagamento` na
  devolução → a timeline da OS conta a história inteira

### 4.6 Repasse da taxa (decisão 5) — o ponto mais delicado

**Fórmula.** Acréscimo aditivo não recupera a taxa, porque o MP cobra sobre o total
cobrado. Usa-se *gross-up*:

```
ValorCobrado   = arredonda_para_cima_centavo( ValorBase / (1 - taxa) )
ValorAcrescimo = ValorCobrado - ValorBase
```

| Base | Taxa | Aditivo (errado) | Líquido | Gross-up | Líquido |
|---|---|---|---|---|---|
| R$ 100,00 | 0,99% (Pix) | R$ 100,99 | **R$ 99,99** ❌ | R$ 101,01 | R$ 100,01 ✔ |
| R$ 100,00 | 4,98% (cartão) | R$ 104,98 | **R$ 99,75** ❌ | R$ 105,25 | R$ 100,01 ✔ |

Arredondamento para cima favorece a oficina; a diferença é de centavos.

**Contabilidade.** O acréscimo **não é receita da OS** — é reembolso de custo. Por
isso ele vive na intenção e **não** entra em `TotalGeral`, `TotalServicos` nem em
`TotalProdutos`. Consequências:
- `Pagamento.Valor = ValorBase` → `SaldoDevedor` fecha em zero corretamente
- Relatórios de faturamento **não incham** com taxa repassada
- Um recorte novo ("acréscimos repassados no período") sai da tabela de intenções
- ⚠️ Se o contador quiser o acréscimo como receita + despesa espelhadas, isso é
  modelagem fiscal — fora deste escopo (NFe já é item futuro do ROADMAP)

**Transparência é obrigatória.** A Lei 13.455/2017 permite preço diferenciado por
meio de pagamento, mas exige informação ostensiva **antes** do pagamento. Então o
acréscimo aparece, sempre discriminado, em quatro lugares:
1. Dialog da bancada: `Saldo R$ 100,00 + taxa R$ 1,01 = **R$ 101,01**`
2. Mensagem enviada: placeholders `{Acrescimo}` e `{ValorCobrado}` no template
3. PDF: linha "Acréscimo por pagamento via Pix/cartão"
4. `description` / `items[].title` da preference no Checkout

**Feedback loop contra config desatualizada.** Na aprovação, compara-se
`ValorLiquido` com `ValorBase`. Se ficou abaixo, a taxa configurada está velha:
loga warning, marca a intenção e o relatório de reconciliação lista o rombo. Sem
isso a config vira ficção silenciosa depois da primeira renegociação com o MP.

**Cartão parcelado.** Duas camadas distintas: os **juros das parcelas** vão ao
cliente pela própria configuração do Checkout Pro (`JurosParcelamentoAoCliente`);
a **taxa base do MP** vai pelo gross-up acima. Não confundir as duas.

### 4.7 Gate de CPF/CNPJ (decisão 6)

- Back: os handlers de criação de intenção exigem `Cliente.CpfCnpj` preenchido →
  `RegraNegocioException("Cadastre o CPF/CNPJ do cliente para cobrar online.")` (400)
- Front: botões de cobrança **desabilitados** com tooltip explicativo e link direto
  para editar o cliente; `ClienteResumoCard` na OS mostra o alerta
- `Cliente.CpfCnpj` **continua opcional no cadastro** — não quebra os clientes já
  existentes; a obrigatoriedade é do fluxo de cobrança online
- Melhoria opcional: hoje `clienteSchema.ts` valida só a quantidade de dígitos
  (11/14). Adicionar **dígito verificador** reduz recusa do MP por CPF inválido

### 4.8 Validade do Pix (decisão 8)

- **Bancada**: `PixExpiraMinutosBancada` (30) alimenta `date_of_expiration` e o timer
- **Remoto**: `PixExpiraMinutosRemoto` alimenta `date_of_expiration` **e** o
  placeholder `{Validade}` da mensagem — a config é a **única** fonte, então texto e
  QR nunca divergem
- Template sem `{Validade}` mas com `{PixCopiaECola}` → **422 na config** (§ 3.4)
- QR expirado no front → botão "gerar novo QR" (nova intenção, nova auditoria)
- Pagamento que chega após expirar: tratado pela regra "`Aprovada` vence `Expirada`" (§ 4.3)
- `GerarCobrancaOnline` e `EnviarCobranca` na auditoria em toda geração/envio

### 4.9 Envio da cobrança com PDF

`EnviarCobrancaComDocumentoHandler`:
1. gera o PDF (`GerarPdfOrdemServicoQuery`; `orcamento` se OS aberta, `recibo` se concluída)
2. se pedido, cria a intenção (`LinkCheckout` ou `PixQr` remoto) ou reaproveita uma pendente e válida
3. monta a mensagem do template `MensagemCobrancaOnline`
4. WhatsApp com anexo → e-mail com anexo como fallback (mesma cascata do
   `CobrancaJobService`, respeitando `FallbackHabilitado`)
5. grava `HistoricoCobranca` com `IntencaoPagamentoId` + `ComAnexo` e audita `EnviarCobranca`

Extensões necessárias:
- `IWhatsAppService.EnviarDocumentoAsync(telefone, legenda, nomeArquivo, byte[] pdf, ct)`
  → Evolution `POST /message/sendMedia/{instancia}` com
  `{ number, mediatype: "document", mimetype: "application/pdf", media: <base64>, fileName, caption }`
  (respeita `UsarStub`)
- `IEmailService.EnviarAsync(..., IEnumerable<AnexoEmail>? anexos)`
- `OrdemServicoPdfDados` ganha `LinkPagamento`, `PixCopiaECola`, `ValorAcrescimo`,
  `ValorCobrado`, `ValidadeTexto`; o QuestPDF renderiza o bloco "Pague agora" com QR
  (nova dependência **`QRCoder`**, MIT)

### 4.10 Job de reconciliação (Hangfire)

`reconciliacao-pagamentos`, a cada 5 min:
- `Pendente` não expirada → consulta o MP e aplica via `AplicarStatusGatewayHandler`
  (rede de segurança para webhook perdido — não dá para depender só dele)
- `Pendente` com `ExpiraEm < agora` → `MarcarExpirada()` + auditoria
- Preference sem `IdPagamentoExterno` → `BuscarPorReferenciaAsync`
- **`Expirada` recente ainda é reconsultada** (janela de 24h) por causal da regra
  "`Aprovada` vence `Expirada`"
- Acumula divergências de taxa (§ 4.6) para o relatório

### 4.11 Endpoints

| Operação | Rota | Role |
|---|---|---|
| Criar QR Pix | `POST /api/cobranca-online/pix` | Operador |
| Criar link Checkout | `POST /api/cobranca-online/link` | Operador |
| Simular valores (base + acréscimo) | `GET /api/cobranca-online/simular?ordemId=&valor=&tipo=` | Operador |
| Consultar intenção (polling) | `GET /api/cobranca-online/{id}` | Operador |
| Listar intenções da OS | `GET /api/cobranca-online/ordem/{ordemId}` | Operador |
| Cancelar intenção pendente | `DELETE /api/cobranca-online/{id}` | Operador |
| Reembolsar (total/parcial) | `POST /api/cobranca-online/{id}/reembolso` | **Admin** |
| Enviar cobrança com PDF+link | `POST /api/cobrancas/enviar-documento/{ordemId}` | Operador |
| Obter/atualizar config | `GET`/`PUT /api/configuracoes/pagamento` | **Admin** |
| Testar credenciais | `GET /api/configuracoes/pagamento/status` | **Admin** |
| Webhook | `POST /api/webhooks/mercadopago` | anônimo + assinatura |

Todos com `[ProducesResponseType(typeof(ApiResponse<T>), 200)]` — senão o tipo não
aparece no `openapi.json` e o front não recebe o shape.

> `/simular` existe para o front mostrar `base + acréscimo = total` **antes** de
> criar a intenção, sem duplicar a fórmula de gross-up no TypeScript. A conta vive
> em um lugar só.

---

## 5. Front

### 5.1 Nova slice `src/features/cobranca-online/`

```
hooks/
  useCriarPixOrdem.ts          useCriarLinkOrdem.ts
  useSimularCobranca.ts        useObterIntencao.ts (polling; para em status terminal)
  useListarIntencoesDaOrdem.ts useCancelarIntencao.ts
  useReembolsarIntencao.ts     useEnviarCobrancaComDocumento.ts
components/
  CobrarNaBancadaDialog.tsx    QrPixPanel.tsx          LinkPagamentoPanel.tsx
  EnviarCobrancaDialog.tsx     IntencoesPagamentoTable.tsx
  AdiantamentoAviso.tsx        ExcedenteAviso.tsx      ResumoValorCobrado.tsx
helpers/
  cobrancaOnlineSchemas.ts     contagemRegressiva.ts
```

**`CobrarNaBancadaDialog`** — o coração da UX pedida:
- Tabs **Pix** / **Link**
- `ResumoValorCobrado` no topo: `Saldo R$ 100,00 + taxa R$ 1,01 = R$ 101,01`
  (vem de `/simular`, nunca calculado no front)
- Pix: QR grande (do EMV via `qrcode.react`), botão "copiar código",
  **contagem regressiva** até `expiraEm`, badge de status ao vivo (polling 3s),
  estado de sucesso em verde que invalida `['pagamentos', ordemId]`,
  `['ordens', ordemId]` e `['cobranca-online', ordemId]`
- Expirado → "gerar novo QR"
- Valor default = `saldoAPagar`, editável (parcial permitido)
- Bloqueio de CPF: se o cliente não tem CPF/CNPJ, o dialog nem abre — aviso com
  link para editar o cliente

**Modalidade Adiantamento** (decisão 2): com a OS fora de `Concluida`, o dialog abre
com confirmação explícita — *"Esta OS ainda não foi concluída. O valor entra como
**adiantamento** e será registrado como pagamento automaticamente ao concluir a
OS."* Sem esse opt-in, os botões seguem desabilitados como hoje.

**Enums novos** em `shared/enums/`: `statusIntencaoPagamento.ts`,
`tipoIntencaoPagamento.ts`, `modalidadeCobranca.ts` (padrão de `formaPagamento.ts`:
valor numérico + label PT-BR + marca visual; badge nunca com cor hardcoded).

**Permissões** (`shared/guards/permissions.ts`): `cobrancaOnline.criar` (Operador),
`cobrancaOnline.reembolsar` (**Admin**, `AdminOnlyPermission`).

### 5.2 Encaixes em telas existentes

| Tela | Mudança |
|---|---|
| `PagamentosOrdemSection` | Botões **"Cobrar na bancada (QR)"** e **"Enviar cobrança"**; `IntencoesPagamentoTable` abaixo dos pagamentos. O aviso "só em OS Concluída" passa a explicar o caminho do adiantamento |
| `OrdemDetalhePage` | Resumo ganha `Adiantado` e `Saldo a pagar`; `AdiantamentoAviso` e `ExcedenteAviso` (persistentes, não toast). A timeline já existente exibe as novas operações **sem código novo** |
| `FecharOrdemDialog` | "R$ X de adiantamento será registrado como pagamento" antes de confirmar |
| `PendenciasPage` | Ação rápida "Enviar cobrança"; sinaliza OS com excedente a devolver |
| `ConfiguracoesPage` | Nova aba **"Mercado Pago"**: access token (mascarado `••••`, vazio = mantém), public key, webhook secret, ambiente, switch de stub, as duas validades de Pix, `BaseUrlPublica`, e-mail fallback, **bloco de taxas** (repassar on/off, % Pix, % cartão, juros ao cliente) com aviso de que a taxa é digitada, parcelas, boleto. Mais: URL do webhook em read-only com botão copiar e **"Testar credenciais"** com card de status |
| `HistoricoCobrancaPage` | Colunas "Anexo" e link para a intenção |
| `clienteSchema.ts` | (opcional) dígito verificador de CPF/CNPJ |

### 5.3 Tipos e testes

- `npm run api:types` **no mesmo PR** que consome cada mudança de back (regra
  inegociável do `CLAUDE.md`); `src/api/types.ts` só ganha *aliases* de `components['schemas']`
- Testes: schemas zod (puro); `CobrarNaBancadaDialog` com `user-event` + MSW cobrindo
  **pendente → aprovado via polling**, **expiração** e **cliente sem CPF**;
  `EnviarCobrancaDialog` (canais/anexo/preview); exibição do acréscimo;
  guard de `reembolsar` para Operador; helper de contagem regressiva
- Dependência nova: `qrcode.react`

---

## 6. Segurança

- **Access token nunca chega ao front.** O DTO de leitura devolve mascarado, como já
  faz a `ApiKey` da Evolution
- Webhook: assinatura HMAC + re-consulta ao MP + idempotência por evento. Sem os
  três, um POST forjado "quita" uma OS
- `IDataProtector` em container precisa de **volume persistente** para o KeyRing — a
  armadilha já documentada em `cobranca-whatsapp.md` vale igual; sem isso o token
  cifrado vira lixo no primeiro restart
- Checkout Pro é redirect → **nenhum dado de cartão passa pelo AutoCore** (PCI fora de escopo)
- `notification_url` exige **HTTPS público**. Dev: `cloudflared tunnel`/ngrok apontando
  `BaseUrlPublica` (ou só o stub, que cobre o dia a dia)
- Do payload do MP guardamos hash + campos usados, não o JSON inteiro (LGPD)
- Reembolso é **Admin** e vai para a auditoria, como o estorno

---

## 7. Fases de entrega

Cada fase é commitável e verificável sozinha. Nomenclatura seguindo os commits
existentes (`Fase H`, `Fase I` …).

| Fase | Entrega | Verificação | Tamanho |
|---|---|---|---|
| **J1 — Fundação** | `configuracao_pagamento` (com bloco de taxas) + cifra + `IMercadoPagoClient` + stub + endpoints de config + aba "Mercado Pago" | Admin salva credenciais e "Testar credenciais" responde OK | M |
| **J2 — Pix na bancada** | `IntencaoPagamento` + gross-up + `/pix` + `/simular` + `GET /{id}` + webhook + `AplicarStatusGatewayHandler` + gate de CPF + `CobrarNaBancadaDialog` com timer e polling + auditoria de geração/confirmação | OS concluída: gera QR mostrando `base + taxa`, stub aprova, pagamento de **`ValorBase`** aparece na OS sem refresh; timeline registra geração e confirmação | **G** |
| **J3 — Adiantamento** | `Modalidade`, `TotalAdiantado`, `SaldoAPagar`, conversão no `Fechar`, excedente + aviso persistente, guard no `Cancelar`, auditoria completa | Adianta R$ 100 em OS aberta → fecha OS → pagamento registrado. Adianta R$ 100 em OS que fecha com R$ 80 → aviso "R$ 20 a devolver" + reembolso parcial pelo Admin | **G** |
| **J4 — Link Checkout Pro** | `/link`, preference com `back_urls`, parcelas, juros ao cliente, `LinkPagamentoPanel`, `IntencoesPagamentoTable` | Link abre o Checkout com o valor acrescido; pagamento no sandbox cai na OS | M |
| **J5 — Cobrança com PDF** | `sendMedia`, anexo no e-mail, QR/link/acréscimo no PDF (`QRCoder`), template `MensagemCobrancaOnline` com validação de `{Validade}`, `EnviarCobrancaDialog` | Cliente recebe no WhatsApp o PDF do orçamento + texto com link, valor cobrado e validade declarada | **G** |
| **J6 — Operação** | Job de reconciliação (inclui janela de `Expirada` e divergência de taxa), reembolso Admin completo, relatório de acréscimos/divergências, docs | Webhook desligado à força → job reconcilia em ≤5 min; taxa configurada errada aparece no relatório | M |

Ordem: **J1 → J2 → J3 → J4 → J5 → J6**. J2 é o marco que prova a integração ponta a
ponta; J3 cresceu com o excedente; J5 é o que mais toca código existente (WhatsApp,
e-mail, PDF) e por isso vem depois da integração estar estável.

---

## 8. Docs a atualizar (mesmo PR de cada fase)

- **Novo:** `../AutoCore/docs/regras-negocio/pagamentos-online.md` — regra canônica de
  intenções, adiantamento, **repasse de taxa**, excedente, webhook, reembolso
- `pagamentos.md` — seção "Pagamento online e adiantamento": a regra "só em OS
  Concluída" segue valendo; adiantamento é o caminho explícito; `Pagamento` registra
  **valor base**, nunca o cobrado
- `cobranca-whatsapp.md` — envio com anexo, novo template e placeholders, `ComAnexo`
- `configuracoes.md` — 5º grupo (`configuracao_pagamento`) + chave `MensagemCobrancaOnline`
- `auditoria.md` — as sete novas operações de § 3.5
- `docs/api-frontend.md` — novos endpoints/envelopes
- `ROADMAP.md` (front) — pagamentos online não está listado hoje
- `openapi.json` (back) → `npm run api:types` (front)

---

## 9. Pré-requisitos operacionais

1. Conta Mercado Pago com **aplicação criada** no painel de desenvolvedores
2. `Access Token` de teste e de produção, `Public Key` e **webhook secret**
3. Chave Pix da conta MP ativa
4. **Taxas negociadas da conta** (Pix e cartão, por prazo de recebimento) — precisam
   ser digitadas na config; o MP não expõe por API
5. URL pública HTTPS para o webhook (produção: domínio do AutoCore; dev: túnel ou stub)
6. Usuários de teste do sandbox para validar J2/J4

---

## 10. Riscos remanescentes

| # | Ponto | Situação |
|---|---|---|
| 1 | **Pix remoto com 30 min** — a validade do Pix enviado por WhatsApp vale a partir da geração, não da leitura. Se o cliente abrir a mensagem duas horas depois, o QR já morreu e ele volta a ligar para a oficina | `PixExpiraMinutosRemoto` nasce com 30 (conforme decidido) e é **um campo de config** — subir para 1440 (24h) é trocar um número. Recomendo avaliar após as primeiras semanas de uso real |
| 2 | **Acréscimo fora do faturamento** — decisão consciente (§ 4.6): o repasse não é receita da OS. Se o contador quiser ver receita+despesa espelhadas, isso é modelagem fiscal | A confirmar com a contabilidade; fora do escopo destas fases |
| 3 | **Taxa digitada envelhece** — renegociação com o MP sem atualizar a config faz o repasse ficar curto | Mitigado pelo comparativo `ValorLiquido` vs `ValorBase` no job (§ 4.6), que denuncia a divergência |
| 4 | **Transparência do acréscimo** — exibir o valor discriminado antes do pagamento é requisito, não enfeite (§ 4.6) | Coberto nos quatro pontos de exibição; vale revisar o texto com quem cuida do atendimento |
| 5 | **Webhook em dev** exige túnel para o teste real de J2 | Aceitável: o stub cobre o desenvolvimento diário |
| 6 | Confirmação em tempo real por **polling** (3s), não SignalR | Simples e suficiente para bancada; SignalR fica como evolução se incomodar |
| 7 | **Conciliação bancária / split / NFe** | Fora de escopo (NFe já é item futuro do ROADMAP) |
