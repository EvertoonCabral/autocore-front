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

- ☑ Listar OSs com filtros: `status` (enum) + `abertaDe`/`abertaAte` (data) + paginação; tabela com Número, Cliente, Status badge, Aberta em, Total, Saldo (vermelho se > 0)
- ☑ `StatusOrdemBadge` em `shared/components/` consumindo o mapa em `shared/enums/statusOrdem.ts` (5 status com cores light/dark)
- ☑ Helpers de status machine espelhando o back: `podeEditarItens`, `podeFechar`, `podeCancelar`, `podeMudarStatus` + opções de Select (`STATUS_ORDEM_OPTIONS`, `STATUS_EDITAVEIS_OPTIONS`)
- ☑ Detalhar OS: header com Cliente (link) / Status / Aberta em; cards de totais (Serviços, Produtos, Geral, Pago, Saldo); painel de edição inline; seções de Itens de Serviço / Itens de Produto; placeholder de Pagamentos para Fase 4
- ☑ Abrir OS: rota `/ordens/nova` com `ClienteSelect` (busca embutida no select via `useListarClientes` debounced), descrição (≤1000) e observações (≤1000)
- ☑ Adicionar item de serviço: dialog com select do catálogo (apenas ativos) + quantidade ≥ 1; aviso sobre snapshot
- ☑ Adicionar item de produto: dialog com toggle "Do catálogo / Avulso"; modo catalogado mostra estoque atual; modo avulso exige nome+preço; flag "fornecido pelo cliente"
- ☑ Remover itens: trash icon por linha, `ConfirmDialog` destructive; só visível em status editáveis (1 ou 2)
- ☑ Edição inline (descrição, observações, status entre 1/2/3) pelo `EditarOrdemPanel` — salvar habilitado só com `isDirty`
- ☑ Fechar OS: `ConfirmDialog` com aviso especial em vermelho quando OS sem itens
- ☑ Cancelar OS: `ConfirmDialog` destructive avisando sobre estorno de estoque + redirect pra lista após sucesso
- ☑ Status finais (Concluida/Cancelada): painel de edição vira card read-only; mostra `FechadaEm` e `DataVencimentoPagamento` quando aplicável
- ☑ Testes: 14 casos de status machine (transições, edição, fechar, cancelar) + 13 casos de schemas (abrir, atualizar — bloqueia 4/5, item serviço, item produto avulso vs catalogado)
- ☑ Item "Ordens de Serviço" no Sidebar (ícone `ClipboardList`)

---

## Fase 4 — Financeiro

Pagamentos parciais/totais, pendências, estorno (Admin only).

> Antes: ler [`pagamentos.md`](../AutoCore/docs/regras-negocio/pagamentos.md).

- ☑ `shared/enums/formaPagamento.ts` (Dinheiro=1, Pix=2, Cartao=3, Transferencia=4) com label PT-BR + marca visual + opções de Select
- ☑ Tela `/pendencias` (`GET /api/pagamentos/pendencias`): toggle "Somente vencidas" persistido na URL, badge `Vencida` quando `DataVencimentoPagamento < hoje`, paginação, linha clicável navega para a OS
- ☑ `RegistrarPagamentoDialog` injetado em `PagamentosOrdemSection` (renderizada na `OrdemDetalhePage`)
  - Schema dinâmico `pagamentoSchemaComSaldo(saldoDevedor)` — UI **nunca** submete valor > saldo (validação client-side espelha o back)
  - Tolerância de 0.001 para arredondamento decimal
  - Pré-preenche com o saldo devedor atual (quitação total em 1 clique)
  - Preview "Saldo devedor → Após este pagamento" com destaque verde quando zera
  - Botão de gatilho desabilitado se OS não está `Concluida` ou se saldo já é zero
  - Aviso inline quando OS não pode receber pagamento (status ≠ Concluída)
- ☑ `PagamentosTable` com histórico de pagamentos da OS (data, forma com marca visual, valor, observação)
- ☑ Estornar pagamento (Admin only): `<Can permission="pagamentos.estornar">` + `ConfirmDialog` destructive avisando sobre recálculo do saldo
- ☑ Invalidações de cache cobrem: `pagamentos.all`, `pagamentos.daOrdem(ordemId)`, `ordens.detail(ordemId)` (totais recalculados) e `ordens.all`
- ☑ Testes: 11 casos cobrindo schema base + `pagamentoSchemaComSaldo` (aceita quitação total, aceita parcial, **rejeita excesso de saldo**, tolerância de arredondamento, formas 1..4, observação max 300, transformação null, coerção de string)
- ☑ Item "Pendências" no Sidebar (ícone `CreditCard`)

---

## Fase 5 — Cobrança e Configurações

Cobrança WhatsApp + tela de configurações (Admin only).

> Antes: ler [`cobranca-whatsapp.md`](../AutoCore/docs/regras-negocio/cobranca-whatsapp.md)
> e [`configuracoes.md`](../AutoCore/docs/regras-negocio/configuracoes.md).

### Cobrança

- ☑ Tela `/cobrancas` (`GET /api/cobrancas/historico`) com filtros `ordemServicoId`, `somenteFalhas` (URL-persistido via `usePagedQuery`), paginação
- ☑ Coluna Status com badge verde "Enviado" / `destructive` "Falha"; mensagem de erro com `line-clamp-2` e tooltip mostrando texto completo (`title`); linha clicável navega para a OS relacionada
- ☑ Hook `useDispararCobranca` (POST manual) + botão "Disparar agora" gateado por `<Can permission="cobrancas.disparar">` + `ConfirmDialog` com explicação da idempotência diária
- ☑ Toast com resumo do resultado (`enviadas / falhas / ignoradas / verificadas` — campos do `CobrancaJobResultado`)
- ☑ Item "Cobranças" no Sidebar (ícone `MessageCircle`)

### Configurações

- ☑ Rota `/configuracoes` protegida por `<RequireRole role="Admin">` — Operador é redirecionado para `/`
- ☑ `configuracaoSchema` (zod): `DiasParaCobranca` int ≥ 0 (limite 365), `MensagemCobranca` 10–2000 chars, `PrecosAtualizadosEm` vazio ou ISO-8601 (validado com `Date.parse`)
- ☑ `useListarConfiguracoes` + `useAtualizarConfiguracao` (PUT por chave); o submit dispara `mutateAsync` **apenas** para os campos com `dirtyFields = true` (front respeita o endpoint por chave do back)
- ☑ `MensagemPreview` com sample (`{Cliente}`=João Silva, `{Numero}`=OS-0007, `{Valor}`=150,00, `{Vencimento}`=06/05/2026); fallback para o template embutido do back quando o campo está vazio; suporta alias `{Vencimento:dd/MM/yyyy}`
- ☑ Item "Configurações" no `UserMenu` (Admin only) — não vai no Sidebar
- ☑ Testes: schema (9 casos) + render de placeholders (4 casos) + gating Admin no botão "Disparar agora"

---

## Fase 5.5 — Auditoria de estado ☑

Rastreabilidade de "quem fez por último" em cada entidade + cobrança individual.

> Antes: ler [`auditoria.md`](../AutoCore/docs/regras-negocio/auditoria.md).

### Back

- ☑ `UsuarioAuditoria` (record struct em `Domain/Auditoria/`)
- ☑ `ICurrentUser` (interface em Application) + impl em API com `IHttpContextAccessor`
- ☑ `AuditoriaMappingExtensions` (`MapearAuditoriaCompleta` / `MapearAuditoriaCriacao`)
- ☑ Colunas `CriadoEm`, `CriadoPorUsuarioId`, `CriadoPorUsuarioNome`, `AtualizadoEm`,
      `AtualizadoPorUsuarioId`, `AtualizadoPorUsuarioNome` em 9 entidades
- ☑ 16 handlers propagam `_currentUser.Snapshot()` aos construtores/métodos
- ☑ DTOs expõem campos no top-level (sem nesting)
- ☑ Migration `AdicionaAuditoria`

### Cobrança individual proativa

- ☑ `POST /api/cobrancas/disparar/{ordemServicoId}` — cobra OS específica antes do
      vencimento; valida Concluída + saldo > 0 + cliente ativo
- ☑ Retorna `CobrancaIndividualResultado` discriminando `Enviada / Falha / JaEnviadaHoje / OsInvalida`
- ☑ Idempotência diária preservada (1 envio com sucesso por OS/dia)

### Front

- ☑ `<AuditoriaInfo>` em `shared/components/` no rodapé de telas de detalhe
- ☑ Plug-in em `ClienteDetalhePage` e `OrdemDetalhePage`
- ☑ `(sistema)` em itálico quando `usuarioNome` é `null` (job automático)
- ☑ `<CobrarOrdemButton>` em `/pendencias` com `ConfirmDialog` rico (cliente,
      telefone, saldo, vencimento) e toast inteligente por status

---

## Fase 5.6 — Log completo de operações ☑

Tabela append-only de operações + permissão granular para liberar
operadores específicos sem promovê-los a Admin.

> Antes: ler [`auditoria.md`](../AutoCore/docs/regras-negocio/auditoria.md)
> (seção "Log completo de operações").

### Back

- ☑ Tabela `auditoria_operacoes` (Id, OcorridoEm UTC, TipoEntidade, EntidadeId,
      Operacao, Descricao, UsuarioId, UsuarioNome snapshot)
- ☑ Constants `TipoEntidadeAuditavel` e `OperacaoAuditavel` em
      `Domain/Auditoria/TiposAuditaveis.cs` (use, nunca strings cruas)
- ☑ `IAuditoriaService` injetado em 14 handlers; grava **após** o `SalvarAsync` principal
- ☑ `AtualizarOrdemServico` só registra `MudarStatus` quando status muda
- ☑ `AtualizarCatalogoServico` gera linha extra `DefinirComoPadrao` quando
      flag passa de `false → true`
- ☑ Migration `AdicionaAuditoriaOperacaoEPermissaoAuditoria`

### Permissão granular (FlagPermission)

- ☑ `ApplicationUser.PodeVerAuditoria` (bool, default `false`)
- ☑ `TokenService` emite claim `perm:auditoria=true` quando flag está ligada
- ☑ Policy `"VerAuditoria"` em `Program.cs` — autoriza Admin OR claim
- ☑ `AuditoriaController` exige a policy
- ☑ `GET /api/auth/usuarios` (Admin) — lista com a flag
- ☑ `PUT /api/auth/usuarios/{id}/permissao-auditoria` (Admin) — liga/desliga
- ☑ `/api/auth/me` retorna `podeVerAuditoria: boolean`

### Endpoints de leitura

- ☑ `GET /api/auditoria/{tipoEntidade}/{entidadeId}` — timeline (sem paginação)
- ☑ `GET /api/auditoria` — relatório paginado com filtros (usuarioId, tipoEntidade,
      operacao, de, ate)

### Front

- ☑ `permissions.ts` ganha `FlagPermission` — `auditoria.ver` é o primeiro caso
- ☑ `<Can>` e `useCan()` propagam flags do `useAuth().user` automaticamente
- ☑ Feature `auditoria/`: `<AuditoriaTimeline>`, `<AuditoriaFiltros>`,
      `AuditoriaRelatorioPage`, 4 hooks (timeline, relatório, usuários, permissão)
- ☑ `auditoriaLabels.ts` com mapa PT-BR e ícones lucide por operação
- ☑ Rota `/relatorios/auditoria` gated por `useCan('auditoria.ver')`
- ☑ Sidebar mostra item "Auditoria" só quando autorizado
- ☑ `<AuditoriaTimeline>` plugada em `ClienteDetalhePage` e `OrdemDetalhePage`
      (seção inteira condicionada por `useCan` para não deixar título órfão)
- ☑ `ConfiguracoesPage` refatorada com `Tabs` (shadcn): aba "Geral"
      (configurações pré-existentes) + aba "Acesso à Auditoria" (lista de
      operadores com `<Switch>` otimista para liberar a flag, com rollback em erro)

### Docs

- ☑ `docs/regras-negocio/auditoria.md` — seção "Log completo de operações"
- ☑ `CLAUDE.md` (back) — seção "Log de operações (`auditoria_operacoes`)" com
      snippet de handler
- ☑ `CLAUDE.md` (front) — seções `<AuditoriaTimeline>`, `/relatorios/auditoria` e `FlagPermission`
- ☑ `docs/regras-negocio/autenticacao.md` — seção "Permissões por flag"
- ☑ `docs/api-frontend.md` — endpoints + role-based vs flag-based em §7

---

## Fase 6 — Completude funcional ☐ (Caminho A)

Fecha os buracos da UI: o produto já é "funcionalmente completo", mas há
áreas onde o usuário ainda precisa do banco para certas operações ou onde
falta o "feeling" de tela acabada.

### CRUD de usuários via UI ☐

> Antes: ler [`autenticacao.md`](../AutoCore/docs/regras-negocio/autenticacao.md).

Endpoints já existem no back (`POST /api/auth/usuarios`,
`PUT /api/auth/usuarios/{id}`, `GET /api/auth/usuarios`). Falta a tela
Admin para criar/editar/desativar operadores sem precisar ir ao banco.

- ☐ Rota `/usuarios` protegida por `<RequireRole role="Admin">`
- ☐ Listagem com nome, email, role, ativo, `podeVerAuditoria` (badge)
- ☐ `<NovoUsuarioDialog>` — nome + email + senha temporária + role (Admin/Operador)
- ☐ `<EditarUsuarioDialog>` — nome + ativo (toggle) + reset de senha opcional
- ☐ Soft-delete de usuário (desativar — mantém histórico de auditoria)
- ☐ Filtro "incluir inativos" no toggle
- ☐ Item "Usuários" no UserMenu (não Sidebar — admin-side)
- ☐ Testes: schema (zod), gating, mutation otimista

### Telas de detalhe Produto e Serviço ☑

Hoje criar/editar funcionam via dialog na própria lista. Falta rota
dedicada `/produtos/:id` e `/servicos/:id` com auditoria visível.

- ☑ `ProdutoDetalhePage` (`/produtos/:id`): dados + `<AuditoriaInfo>` + `<AuditoriaTimeline>`
- ☑ `ServicoDetalhePage` (`/servicos/:id`): dados + `<AuditoriaInfo>` + `<AuditoriaTimeline>`
- ☑ Linha da listagem vira clicável (já é padrão em outras features)
- ☑ Botões "Editar" e "Desativar" movidos da listagem para a tela de detalhe
- ☑ Serviço padronizado em 3 rotas dedicadas (novo, detalhe, editar), espelhando Cliente e Produto

### Dashboard real ☑

Hoje a `/` é placeholder "Bem-vindo, {nome}". Vamos popular com indicadores.

- ☑ Endpoint dedicado `GET /api/dashboard/resumo` no back — agregação num shot
      (contagens por status, pendências vencidas count+total, estoque abaixo do
      mínimo, faturamento do mês, últimas 5 OSs, 5 pendências mais antigas)
- ☑ Hook `useDashboardResumo` com `staleTime: 60s`
- ☑ 6 KPI cards (`<KpiCard>`) com border-l colorida por variant (info/warning/
      destructive/success), skeleton de loading consistente
- ☑ `<UltimasOrdensCard>` (5 itens, link para `/ordens/{id}`)
- ☑ `<PendenciasAntigasCard>` (5 itens, badge "Vencida", saldo em vermelho)
- ☑ Acessível a todos os autenticados (Admin e Operador)
- ☑ Testes: handler back (8 casos com EF InMemory) + helpers/components front (22)
- ☑ Gráficos: faturamento mensal (1/3/6/12), formas de pagamento, status OSs em aberto + ícones lucide nos KPI cards (recharts + chart shadcn)

### Plug-ins menores ☐

- ☐ `<AuditoriaInfo>` na tela de Configuração (mostrar quem alterou cada chave)
- ☐ `<AuditoriaTimeline>` em `ConfiguracoesPage` (timeline das mudanças)
- ☐ Aviso visual em OS Concluída há mais de N dias sem pagamento (badge "Atrasada >30d")
- ☑ Configuração de empresa: nome + logo com upload (PNG/JPG/WebP, max 2MB), preview, remoção, exibição no header global com cache ETag

**Definição de pronto da Fase 6:** ☐ admin não precisa mais tocar no banco
para operações cotidianas; dashboard mostra estado real do negócio; todas as
telas de detalhe têm auditoria.

---

## Fase 7 — Produção ☐ (Caminho B)

Sair do localhost — hardening de segurança, CI/CD, containerização e deploy
em AWS. Pré-requisito para qualquer uso real.

### CI/CD ☐

- ☐ GitHub Actions no front: `npm ci && npm run lint && npm run typecheck && npm test && npm run build` em PR para `main`
- ☐ GitHub Actions no back: `dotnet restore && dotnet build && dotnet test` em PR
- ☐ Status checks obrigatórios antes de merge
- ☐ Cache de dependências (npm + nuget) para acelerar workflows
- ☐ Build de produção do front pushed para ECR (ou destino escolhido)
- ☐ Build do back pushed para ECR

### Containerização ☐

- ☐ `Dockerfile` multi-stage do front: stage Node para `npm run build`, stage nginx para servir `/dist`
- ☐ `Dockerfile` do back: stage SDK para `dotnet publish`, stage runtime aspnet
- ☐ `nginx.conf` com `try_files $uri $uri/ /index.html` (SPA fallback) +
      headers de segurança (CSP, X-Frame-Options, Referrer-Policy,
      Permissions-Policy, Strict-Transport-Security)
- ☐ `docker-compose.yml` para dev local — back + front + PostgreSQL + (opcional) Evolution API

### Headers de segurança ☐

- ☐ CSP estrita (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ...`)
- ☐ Validar via [securityheaders.com](https://securityheaders.com) — target A+

### AWS ☐

- ☐ VPC + subnets privadas + NAT Gateway
- ☐ RDS PostgreSQL (versão alinhada com `Npgsql` em uso) com backup automático
- ☐ ECS Fargate (back) com task definition + service + auto-scaling básico
- ☐ Front: S3 + CloudFront **ou** ECS Fargate atrás de ALB (decisão por custo/CDN)
- ☐ ALB com HTTPS (ACM) + cookies `Secure` (já condicionado a `!IsDevelopment()` no back)
- ☐ Domínio customizado + Route 53
- ☐ Secrets via AWS Secrets Manager / Parameter Store (`Jwt:SecretKey`, ConnectionStrings,
      `EvolutionApi:ApiKey`) — nada hardcoded em `appsettings`
- ☐ Hangfire dashboard só acessível via VPN/IP allowlist

### Monitoramento ☐

- ☐ Sentry no front (captura de erros não tratados + breadcrumbs do React Query)
- ☐ CloudWatch Logs / Application Insights no back (Serilog já está pronto, falta sink)
- ☐ Alertas: erro rate > X%, latência p95 > Y ms, DB CPU > Z%
- ☐ Health check endpoint público (`GET /health`) consumido pelo ALB

**Definição de pronto da Fase 7:** ☐ produto rodando em produção sob domínio
HTTPS próprio, CI bloqueando merge sem testes, deploy automatizado via push para `main`.

---

## Fase 8 — Funcionalidades novas ☐ (Caminho C)

Expansões além do roadmap original. Cada item é independente — pode ser
priorizado conforme demanda real do uso em produção.

### Exportar OS em PDF ☐

- ☐ Lib server-side (QuestPDF ou similar) ou client-side (jsPDF/react-pdf)
- ☐ Layout: cabeçalho com logo da oficina, dados do cliente, itens (serviços + produtos),
      totais, condições de pagamento, assinatura
- ☐ Botão "Imprimir orçamento" na tela da OS (status Aberta/EmAndamento)
- ☐ Botão "Imprimir recibo" na tela da OS (status Concluida + pagamento total)
- ☐ Watermark "ORÇAMENTO" / "RECIBO" para diferenciação

### Relatórios ☐

- ☐ Faturamento por período (gráfico de barras mensal + tabela de detalhes)
- ☐ Ranking de serviços mais usados (top 10 por quantidade e por receita)
- ☐ Ranking de produtos mais vendidos (idem)
- ☐ OSs por atendente (volume + ticket médio)
- ☐ Pendências por idade (1-30 / 31-60 / 61-90 / 90+)
- ☐ Item "Relatórios" no Sidebar como grupo (já tem Auditoria — agrupar)
- ☐ Exportar relatórios em CSV/Excel

### Notificações ☐

- ☐ Email como fallback do WhatsApp (cliente sem WhatsApp mas com email)
- ☐ Badge no header com count de pendências vencidas e OSs aguardando produto há +N dias
- ☐ Toast notifications quando uma cobrança automática falha em massa

### Histórico rico de OS ☐

A timeline atual mostra mudanças de status. Pode ficar mais rica:

- ☐ Timeline inclui pagamentos registrados e estornados (já tem o dado em Pagamento)
- ☐ Timeline inclui itens adicionados/removidos (já tem em ItemServico/ItemProduto)
- ☐ Timeline inclui cobranças disparadas (já tem em HistoricoCobranca)
- ☐ Visualização unificada na `OrdemDetalhePage` numa tab dedicada

### Mobile-first / PWA ☐

- ☐ Service Worker + manifest para instalável
- ☐ Layout responsivo testado em iPhone/Android (atendente no balcão)
- ☐ Modo offline para consultas (último cache válido)
- ☐ Câmera para anexar fotos do veículo na OS (depende de "Storage externo" abaixo)

### Storage externo para arquivos ☐

Hoje a logo da empresa fica em `configuracao_empresa.logo_conteudo`
(bytea no Postgres) — funcional para uma imagem pequena, mas não escala
para múltiplos uploads por OS, galerias de produtos, anexos de documentos.
Quando o volume de imagens crescer, migrar para storage externo.

**Disparadores para fazer essa migração:**
- Anexar **fotos do veículo** na OS (entrada, durante o serviço, conclusão)
- **Avatar** no cadastro de usuário (operadores e clientes)
- **Galeria de produtos** com foto do item
- **Documentos anexos** (orçamento assinado em PDF, comprovante de pagamento,
  NFe emitida)

**Mudanças necessárias:**

- ☐ Escolher provedor:
  - **AWS S3** (padrão; integra com a opção 7 do roadmap, ALB/CloudFront)
  - **MinIO self-hosted** (S3-compatible, sem dependência de cloud)
  - **Cloudflare R2** (S3-compatible, sem egress fee — atrativo para imagens)
- ☐ Abstração `IArmazenamentoArquivos` no back (Application) com
  implementações `S3ArmazenamentoArquivos` / `MinioArmazenamentoArquivos` —
  controlador via configuração
- ☐ Endpoints retornam **URLs presigned** (curtas, com expiração) para o
  front renderizar `<img>` direto do bucket — sem proxy via API
- ☐ Migrar logo da empresa para o bucket; manter `logo_conteudo` (bytea)
  como fallback durante transição; depois drop da coluna
- ☐ Novo módulo "Anexos de OS" — entidade `AnexoOrdemServico` com
  `OrdemServicoId`, `Categoria` (entrada/durante/conclusão/documento),
  `NomeOriginal`, `ChaveBucket`, `TamanhoBytes`, auditoria
- ☐ Limites por OS (ex.: max 20 anexos, max 5MB cada — configurável)
- ☐ Antivirus scan opcional via Lambda/triggers do S3
- ☐ Política de retenção: anexos de OS canceladas + 30 dias → apagar
- ☐ Front: componente `<UploadArquivo>` reutilizável com drag-n-drop,
  preview, validações client-side; `<GaleriaArquivos>` com lightbox

**Trade-off "fazer junto ou separar":**
- Se a migração para AWS (Fase 7) já trouxer S3, faz sentido fazer junto.
- Se ficar em VPS dedicada, MinIO no mesmo host é mais barato e suficiente.

### Multi-tenant ☐ (eventual)

Só se houver expansão para múltiplas oficinas. Mudança grande de modelo de
dados — adiar até demanda concreta.

### Integração com nota fiscal eletrônica ☐

- ☐ Avaliar provedor (Focus NFe, NFe.io, etc.)
- ☐ Configurar emissão automática ao receber pagamento total
- ☐ Cliente recebe NFe por email + WhatsApp

---

## Anotações de planejamento

**Ordem recomendada de execução:** 6 → 7 → 8.

- **6 primeiro** porque é incremental, baixo risco e fecha o produto. O usuário
  final percebe melhoria imediata.
- **7 depois** porque sem produção nada do que foi construído tem uso real.
  Também valida o produto em ambiente de verdade antes de adicionar features novas.
- **8 por último** com produto no ar e dados reais informando prioridades —
  não vale a pena construir um relatório complexo sem saber qual recorte os
  usuários pedem.

Cada item dentro de uma fase é independente, então a fase não precisa ser
"completa-completa" antes de tocar a próxima — mas o ROADMAP recomenda
encerrar o caminho A antes de B para evitar dois fronts abertos.
