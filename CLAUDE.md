# AutoCore — Front-end

Cliente web do sistema AutoCore (gestão de auto elétrica).
Stack: **Vite · React 18 · TypeScript estrito · Tailwind CSS · shadcn/ui · React Query · React Router · React Hook Form + zod**

> Backend em `../AutoCore/` (ASP.NET Core 10 + PostgreSQL).
> Regras de negócio canônicas: `../AutoCore/docs/regras-negocio/`.

---

## Princípio: docs do back acompanham o código

Antes de mexer em **qualquer** módulo, leia o arquivo correspondente em
`../AutoCore/docs/regras-negocio/` (clientes, catálogo de serviços, produtos,
ordens de serviço, pagamentos, cobrança WhatsApp, configurações,
autenticação). Se a feature contradiz uma regra documentada, **pare e
confirme** antes de prosseguir.

---

## Tipos da API — regra inegociável

A pasta `src/api/` contém o cliente tipado. **Nunca redigite shapes que
estão no schema OpenAPI.**

- `src/api/schema.d.ts` é **gerado** a partir de `../AutoCore/docs/openapi.json`.
- Sempre que o backend mudar (novos endpoints, alterações em DTOs):
  1. **Back**: rode `pwsh scripts/export-openapi.ps1` e cometa `docs/openapi.json`.
  2. **Front**: rode `npm run api:types` e cometa `src/api/schema.d.ts` no
     **mesmo PR** que consome a mudança.
- O TypeScript estrito vai apontar exatamente os pontos a ajustar. PR sem
  `schema.d.ts` regenerado está incompleto — não passa no review.

### Tipos de resposta — fully typed

Desde o commit `cbd90cc` do back, todos os controllers usam
`[ProducesResponseType(typeof(ApiResponse<T>), 200)]` + envelope concreto
(`ApiResponse<T>`, `CriadoDto`, `ApiErrorResponse`,
`ApiValidationErrorResponse`) — o OpenAPI agora tipa response bodies
inteiros. O `src/api/types.ts` ficou reduzido a **aliases** sobre
`components['schemas']` gerados, sem redigitar shapes à mão.

Se precisar adicionar um novo DTO no front: derive de
`components['schemas']['NomeDto']` em `src/api/types.ts`. Não crie
interfaces manuais espelhando DTOs do back — isso é exatamente o que o
schema gerado evita.

---

## Autenticação

JWT em cookie **httpOnly** (`autocore.auth`, `Secure; SameSite=Strict`),
setado pelo back em `POST /api/auth/login`. O front:

- Envia `credentials: 'include'` em **toda** request (configurado no
  `createClient` em `src/api/client.ts`).
- **Nunca** lê o token via JavaScript — defesa contra XSS.
- Detecta 401 via middleware `onResponse` que dispara o evento global
  `autocore:unauthorized`. O `AuthProvider` invalida o cache e o `Toaster`
  mostra "Sessão expirada".
- Hidrata o usuário corrente via `GET /api/auth/me` (React Query, `staleTime: Infinity`).
- Logout: `POST /api/auth/logout` limpa o cookie + `signOut()` derruba o
  estado local.

> O body do `/api/auth/login` ainda devolve `token` para clientes não-browser
> (Swagger, Postman); o front-web ignora.

---

## Permissões (Admin vs Operador)

Mapa em `src/shared/guards/permissions.ts`, espelhando
`../AutoCore/docs/regras-negocio/autenticacao.md`. **Front é só UX** — o back
é a fonte de verdade.

- `canPerform(role, permission)` → `boolean`.
- `<RequireRole role="Admin">` para rotas inteiramente admin (Configurações).
- Use `canPerform` para hide/disable de botões e menus.

---

## Auditoria — regra de exibição

Toda entidade persistida no back tem colunas padronizadas de auditoria
(`CriadoEm`, `CriadoPorUsuarioId`, `CriadoPorUsuarioNome`, `AtualizadoEm`,
`AtualizadoPorUsuarioId`, `AtualizadoPorUsuarioNome` — ver
`../AutoCore/CLAUDE.md`).

No front:

- **Telas de detalhe** das entidades exibem o componente
  `<AuditoriaInfo>` (em `shared/components/`) no rodapé. Renderiza
  "Criado em X por Y" e, quando aplicável, "Atualizado em A por B".
- O nome é **snapshot** do back — preservado mesmo se o usuário for
  desativado/renomeado depois.
- `(sistema)` aparece quando `usuarioNome` é `null` — caso de operação
  automática (job recorrente do back, seed inicial).
- DTOs gerados pelo openapi-typescript já incluem os campos no top-level;
  basta passar para o `<AuditoriaInfo>` sem mapear nada à mão.

Quando criar uma nova feature de detalhe (Fase 6 em diante), **sempre**
adicione o `<AuditoriaInfo>` na tela — é a fonte de verdade para o usuário
saber quem fez o quê.

### Timeline de operações (`<AuditoriaTimeline>`)

Além do bloco "Criado em X · Atualizado por Y" (`<AuditoriaInfo>`), telas
de detalhe podem exibir o **histórico completo** de operações daquela
entidade via `<AuditoriaTimeline tipoEntidade="..." entidadeId={...} />`
(em `features/auditoria/components/`).

- Componente é **gateado por permissão**: Admin sempre vê; Operador
  precisa de `podeVerAuditoria === true` no payload de `/api/auth/me`
  (flag liberada pelo Admin em `/configuracoes` → "Acesso à Auditoria").
- Use `useCan('auditoria.ver')` para condicionar o título da seção
  (`<h3>Histórico de alterações</h3>`) — sem isso o título fica órfão
  quando o usuário não tem permissão.
- Timeline vazia não renderiza nada — não polui a UI.
- Disponível hoje em `ClienteDetalhePage` e `OrdemDetalhePage`. Plug-in
  em telas novas: importar o componente + condicionar seção pelo `useCan`.

### Relatório global de auditoria

Rota `/relatorios/auditoria` exibe log paginado com filtros (usuário,
tipo de entidade, operação, intervalo de datas). Mesmo gating
(`auditoria.ver`). Sidebar mostra o item apenas quando autorizado.

### `permissions.ts` — flags vs roles

Permissões podem ser:
- **`AdminOnlyPermission`**: gating por role (`canPerform(role, perm)`)
- **`FlagPermission`**: gating por flag do usuário (`canPerform(role, perm, flags)`)

`auditoria.ver` é a primeira `FlagPermission` — Admin sempre passa, mas
Operador precisa de `flags.podeVerAuditoria === true`. Use `<Can>` ou
`useCan(perm)` — ambos propagam as flags do `useAuth().user` automaticamente.

---

## Estrutura

```
src/
├── api/                    # Cliente tipado + envelope + erros
│   ├── schema.d.ts         # GERADO — não editar
│   ├── types.ts            # DTOs de resposta (manual, ver § Limitação atual)
│   ├── client.ts           # createClient + middlewares
│   ├── envelope.ts         # unwrap, unwrapPaginated
│   └── errors.ts           # ApiError + toApiError
├── app/                    # Composição: router, providers, main
├── components/ui/          # shadcn primitives (cópias locais)
├── features/<modulo>/      # Vertical slice
│   ├── routes/             # Páginas (rotas)
│   ├── components/         # Componentes da feature
│   ├── hooks/              # Hooks de React Query (queries + mutations)
│   ├── helpers/            # zod schemas, formatters específicos
│   └── __tests__/
├── layouts/                # Layouts compartilhados (Authenticated, Public)
├── lib/                    # cn, env, formatters genéricos
├── shared/                 # Reutilizado por 2+ features
│   ├── guards/             # RequireAuth, RequireRole, permissions
│   ├── hooks/              # usePagedQuery, useDebounce…
│   ├── components/         # DataTable, EnumBadge, EmptyState…
│   └── enums/              # statusOrdem, formaPagamento
├── styles/                 # globals.css com tokens shadcn
└── test/                   # MSW + renderWithProviders
```

**Regra de divisão**: componente/hook usado por **2+ features** → `shared/`.
Tudo o mais permanece local. Promove-se quando a duplicação aparece — não
antes.

---

## Padrões de hooks (CQRS conceitual)

- **Queries**: `use{Listar,Obter,...}{Recurso}` → `useQuery`.
  Lê dados, sempre via `unwrap` / `unwrapPaginated`.
- **Mutations**: `use{Criar,Atualizar,Cancelar,Estornar,...}{Recurso}` → `useMutation`.
  Escrita; em `onSuccess` invalida queries afetadas.
- Hooks ficam em `features/<modulo>/hooks/`.

```ts
// Exemplo (esquemático)
export function useListarClientes(filtro: Filtro) {
  return useQuery({
    queryKey: ['clientes', filtro],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/clientes', {
        params: { query: filtro },
      })
      if (error || !data) throw toApiError(error, response.status)
      return unwrapPaginated<ClienteDto>(data)
    },
  })
}
```

---

## Validação de formulário

- zod schema em `features/<modulo>/helpers/<acao>Schema.ts`. Nome e mensagens
  espelham os Validators do back.
- `react-hook-form` + `zodResolver`.
- 422 do back → distribua `detalhes` por campo via `setError(field, { message })`.
- 400 (regra de negócio) → `toast.error(message)` via sonner.

---

## Tema

- Base **zinc** (cinza neutro), accent **laranja `#F97316`** (Tailwind
  `orange-500`) — área automotiva.
- Dark mode habilitado (`darkMode: 'class'`).
- Variant `destructive` (vermelho shadcn) é exclusiva para **DELETE / cancelar
  OS / estornar pagamento / soft-delete**. Não usar em ações reversíveis.
- Badges de status vêm de `shared/enums/` — nunca hardcodear cor.

---

## TDD onde faz sentido

- Hooks customizados → teste com mock MSW.
- Helpers e parsers → teste puro.
- Guards (`RequireAuth`, `canPerform`) → teste de comportamento.
- Componentes complexos (forms, tabelas com filtro/paginação) → teste com
  `user-event`, NÃO snapshot.
- **Não obrigatório** para componentes de apresentação simples.

Suíte: `npm test` (Vitest + Testing Library + MSW). Setup global em
`src/test/setup.ts`. Helper `renderWithProviders` em `src/test/render.tsx`.

---

## Como rodar

```bash
# pré-requisito: backend em http://localhost:5206 com PR de cookie aplicado
nvm use            # Node 20+
npm install
cp .env.example .env
npm run api:types  # gera src/api/schema.d.ts
npm run dev        # http://localhost:5173
```

Outros scripts:
- `npm run typecheck` — `tsc -b --noEmit`
- `npm run lint` — ESLint
- `npm test` / `npm run test:watch` — Vitest
- `npm run build` — produção
- `npm run preview` — serve o build

---

## Convenção de commits

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`,
`refactor:`). **Não incluir assinatura `Co-Authored-By: Claude`** — política
do projeto.

---

## Nota sobre o backend

Mudanças visíveis para o front que exigem PR no back:
- Novo endpoint ou DTO → enrich com `[ProducesResponseType(typeof(...), 200)]`
  para que o tipo apareça no `openapi.json`.
- Nova role ou permissão → atualizar
  `../AutoCore/docs/regras-negocio/autenticacao.md` no mesmo commit.
- Mudança de status code ou envelope → atualizar `../AutoCore/docs/api-frontend.md`.
