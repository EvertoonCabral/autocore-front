# AutoCore Front — Roadmap

Plano de entrega do front-end em 5 fases. Cada fase termina em algo navegável
contra o backend local. As regras de negócio canônicas vivem em
[`../AutoCore/docs/regras-negocio/`](../AutoCore/docs/regras-negocio/) — leia
o arquivo do módulo antes de começar a tarefa.

Convenções:
- ☐ pendente · ☑ pronto
- "Crítico" = bloqueia outras tarefas; faça primeiro.
- Cada item de UI assume: lista paginada + filtro + criar + editar + (quando
  aplicável) ações destrutivas com `AlertDialog` e variant `destructive`.
- TDD onde fizer sentido (hooks, parsers, guards, forms).

---

## Fase 1 — Fundação ☑

Login + layout autenticado + guarda de rota + tratamento global de 401.

- ☑ Bootstrap Vite + React 18 + TS estrito + path alias `@/*`
- ☑ Tailwind CSS + shadcn/ui (base zinc, accent laranja, dark mode, variant destructive)
- ☑ openapi-typescript + openapi-fetch (schema gerado, fetch lazy p/ MSW)
- ☑ React Query, React Router v6, RHF + zod, sonner, lucide
- ☑ Vitest + Testing Library + MSW + helper `renderWithProviders`
- ☑ ESLint + Prettier + plugin Tailwind + lint-staged
- ☑ AuthProvider (`useCurrentUser` via `GET /api/auth/me`)
- ☑ Login: `LoginPage` + `LoginForm` + `useLogin`
- ☑ Logout: `useLogout` + endpoint `POST /api/auth/logout`
- ☑ Layout autenticado (Sidebar + Header + UserMenu) + Dashboard placeholder
- ☑ Guards: `RequireAuth`, `RequireRole` + mapa `permissions.canPerform`
- ☑ Tratamento global 401 (evento `autocore:unauthorized` → toast + redirect)
- ☑ Cookie httpOnly `autocore.auth` (back seta, front nunca toca via JS)
- ☑ `CLAUDE.md` + `README.md` documentando padrões
- ☑ Repo remoto privado em [EvertoonCabral/autocore-front](https://github.com/EvertoonCabral/autocore-front)

---

## Dívidas técnicas (atacar antes/durante Fase 2)

- ☑ **Crítico**: anotar `[ProducesResponseType(typeof(...), 200)]` nos controllers
  do back e introduzir `ApiResponse<T>` concreto + reuso do `ResultadoPaginadoDto<T>`.
  `openapi.json` agora tipa os response bodies; `src/api/types.ts` virou apenas
  aliases sobre `components['schemas']`.
- ☐ Adicionar headers de segurança em produção (CSP estrita, `X-Frame-Options`,
  `Referrer-Policy`). Não afeta dev local.
- ☐ Configurar GitHub Actions: `npm ci && npm run lint && npm run typecheck && npm test && npm run build` em PR.

---

## Fase 2 — Cadastros

CRUD de Clientes, Catálogo de Serviços e Produtos. Estabelece os padrões de
listagem paginada, formulário, gating Admin e snapshots que serão copiados
nas fases seguintes.

> Antes de começar: ler [`clientes.md`](../AutoCore/docs/regras-negocio/clientes.md),
> [`catalogo-servicos.md`](../AutoCore/docs/regras-negocio/catalogo-servicos.md),
> [`produtos.md`](../AutoCore/docs/regras-negocio/produtos.md).

### Plumbing compartilhado (faz uma vez, todo módulo reusa)

- ☑ `shared/components/DataTable` (colunas tipadas, empty state, skeleton de loading, row click)
- ☑ `shared/components/Pagination` (consome `pagina`/`porPagina`/`total` + page-size select)
- ☑ `shared/components/SearchInput` (debounced via `useDebounce`, botão limpar)
- ☑ `shared/components/Can` (hide via `canPerform`) + `useCan`
- ☑ `shared/components/ConfirmDialog` (AlertDialog + variant destructive)
- ☑ `shared/components/PageHeader` (título + descrição + slot de ações)
- ☑ `shared/components/EmptyState` (ícone, título, descrição, ação)
- ☑ `shared/hooks/useDebounce`
- ☑ `shared/hooks/usePagedQuery` (sincroniza paginação + filtros com URL)
- ☑ shadcn primitives adicionados: `dialog`, `alert-dialog`, `select`, `textarea`, `table`
- ☑ `lib/format`: `formatTelefone`, `formatCpf`, `formatBRL`, `formatData`, `formatDataHora`, `onlyDigits`

### Clientes (primeiro módulo — define o padrão)

- ☑ Listar: `useListarClientes` + página com busca por nome/telefone + toggle "incluir inativos" + paginação
- ☑ Detalhar: `useObterCliente` + página com card de dados (próximo: aba "Histórico de OS" — `useObterOrdensDoCliente` já existe)
- ☑ Criar: form + `useCriarCliente` + zod schema espelhando `CriarClienteCommandValidator`
- ☑ Editar: form (reutilizado) + `useAtualizarCliente`
- ☑ Soft delete: botão Admin-only com `<Can>`, `ConfirmDialog` destructive, `useDesativarCliente`
- ☑ Item no Sidebar
- ☑ Testes: schema (zod, 9 casos), gating Admin no botão Desativar (Operador não vê) — 18/18 verdes

### Catálogo de Serviços

- ☑ Listar: nome, preço, badge "Padrão" (estrela) se `EhMaoDeObraPadrao`, badge "Inativo"
- ☑ Criar/Editar: dialog inline na própria lista (sem rota separada — fluxo enxuto)
- ☑ Atualizar preço (Admin only): `<Can>` + `AtualizarPrecoDialog` com endpoint `PATCH /preco`
- ☑ Em modo edição, campo Preço fica `disabled` para Operador (com aviso "Apenas Admin pode alterar o preço")
- ☑ Soft delete (Admin only) com `<Can permission="servicos.desativar">` + ConfirmDialog destructive
- ☑ Testes: schema (7 casos cobrindo nome, preço >= 0, descrição <= 500, transformação null, coerção de string) + precoSchema (3 casos)

### Produtos

- ☑ Listar: filtro nome/referência (debounced), paginação, badge "Abaixo do mínimo" inline
- ☑ Tela `/produtos/abaixo-minimo`: lista dedicada (`useListarProdutosAbaixoMinimo`), empty state amigável quando tudo OK
- ☑ Criar (`/produtos/novo`) / Editar (`/produtos/:id/editar`) com `ProdutoForm`
- ☑ Detalhe (`/produtos/:id`) com card de dados + ações
- ☑ Ajuste de estoque: `AjustarEstoqueDialog` — input signed (+ entrada / − saída), preview "atual → novo" com destaque vermelho se ficar negativo, botão Confirmar desabilitado quando saldo < 0 (espelha a regra do back)
- ☑ Form de edição esconde "Quantidade em estoque" — mudanças no saldo passam exclusivamente pelo dialog
- ☑ Soft delete (Admin only)
- ☑ Testes: produtoSchema (9 casos) + ajustarEstoqueSchema (4 casos: positivo, negativo, zero rejeitado, não inteiro rejeitado)

**Definição de pronto da Fase 2:** ☑ todos os 3 módulos navegáveis, gating Admin
verificado, paginação funcionando, sidebar populada (Clientes, Catálogo, Produtos).

---

## Fase 3 — Operação

Ordens de Serviço — entidade central. Status machine, snapshots, totais
calculados.

> Antes: ler [`ordens-servico.md`](../AutoCore/docs/regras-negocio/ordens-servico.md).

- ☐ Listar OSs com filtros (status enum, cliente, datas)
- ☐ `EnumBadge<StatusOrdem>` em `shared/components/` com cores do mapa
- ☐ Detalhar OS: header com Cliente, Status, Totais, SaldoDevedor; tabs "Itens" e "Pagamentos"
- ☐ Abrir OS: select cliente (busca), descrição, observações
- ☐ Adicionar item de serviço: select do catálogo (apenas ativos) + quantidade
- ☐ Adicionar item de produto: select catálogo OU produto avulso, flag "fornecido pelo cliente"
- ☐ Remover itens: lock se status ≠ `Aberta`/`EmAndamento`
- ☐ Fechar OS: dialog confirmando, exibe `DataVencimentoPagamento` calculada
- ☐ Cancelar OS: dialog destructive, lock se Concluída-com-pagamentos
- ☐ Testes: status machine — botões aparecem/somem corretamente por estado
- ☐ Item no Sidebar

---

## Fase 4 — Financeiro

Pagamentos parciais/totais, pendências, estorno (Admin only).

> Antes: ler [`pagamentos.md`](../AutoCore/docs/regras-negocio/pagamentos.md).

- ☐ Tela "Pendências" (`GET /api/pagamentos/pendencias`) com toggle "somente vencidas"
- ☐ Registrar pagamento: dialog na OS detail com forma + valor + observação
  - validação: valor > 0 e ≤ `SaldoDevedor` (mostra max permitido)
  - lock se OS não está `Concluida`
- ☐ Histórico de pagamentos da OS (tab na detail)
- ☐ Estornar pagamento (Admin only): `<Can>` + `ConfirmDialog` destructive
- ☐ Testes: regra "valor não pode exceder saldo" — UI nunca submete

---

## Fase 5 — Cobrança e Configurações

Cobrança WhatsApp + tela de configurações (Admin only).

> Antes: ler [`cobranca-whatsapp.md`](../AutoCore/docs/regras-negocio/cobranca-whatsapp.md)
> e [`configuracoes.md`](../AutoCore/docs/regras-negocio/configuracoes.md).

### Cobrança

- ☐ Tela "Histórico de cobranças" (`GET /api/cobrancas/historico`) com filtros
  `ordemServicoId`, `somenteFalhas`, paginação
- ☐ Badge sucesso/falha + tooltip com `ErroMensagem` truncada
- ☐ Botão "Disparar agora" (Admin only) — confirmação destructive variant default

### Configurações

- ☐ Rota `/configuracoes` protegida por `<RequireRole role="Admin">`
- ☐ Form com 3 campos do whitelist: `DiasParaCobranca`, `MensagemCobranca`, `PrecosAtualizadosEm`
- ☐ Validação espelhando o back (DiasParaCobranca ≥ 0; MensagemCobranca 10-2000 chars)
- ☐ Preview da `MensagemCobranca` com placeholders renderizados (`{Cliente}`, `{Numero}`, `{Valor}`, `{Vencimento}`)
- ☐ Item "Configurações" no UserMenu (não na Sidebar — é admin-side)

---

## Pós-Fase 5 — preparação para AWS

- ☐ Dockerfile multi-stage (build com node, serve com nginx)
- ☐ `nginx.conf` com `try_files` para SPA + headers de segurança
- ☐ GitHub Actions de build + push para ECR (ou destino escolhido)
- ☐ Configuração de domínio + ALB + CloudFront (cookies httpOnly exigem `Secure`
  em produção — já está condicionado a `IsDevelopment()` no back)
- ☐ Logs/monitoramento (Sentry para erros do front?)
