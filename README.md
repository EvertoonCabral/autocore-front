# AutoCore Front-end

Cliente web do sistema AutoCore (gestão de auto elétrica automotiva).

> Backend: `../AutoCore/` · Stack: Vite · React 18 · TypeScript estrito ·
> Tailwind CSS · shadcn/ui (base zinc, accent laranja) · React Query ·
> React Router · React Hook Form + zod · MSW + Vitest.

## Pré-requisitos

- Node 20 LTS (use `nvm use`).
- Backend em execução em `http://localhost:5206` com o PR de cookie httpOnly
  aplicado (`feat(auth): emite JWT em cookie httpOnly e endpoint de logout`).
- PostgreSQL local rodando (necessário para o backend subir e gerar o
  `openapi.json`).

## Como rodar

```bash
npm install
cp .env.example .env
npm run api:types       # gera src/api/schema.d.ts a partir do openapi do back
npm run dev             # http://localhost:5173
```

Acesso inicial: `admin@autocore.com` / `AutoCore@2024!`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Build de produção |
| `npm run preview` | Serve `dist/` |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier --write |
| `npm test` | Vitest (single run) |
| `npm run test:watch` | Vitest watch |
| `npm run api:types` | Regenera `src/api/schema.d.ts` |

## Onde está o quê

- `src/app/` — composição (router, providers, main).
- `src/api/` — cliente tipado, envelope, erros, schema gerado.
- `src/features/<modulo>/` — vertical slice por feature
  (rotas, componentes, hooks, helpers, testes).
- `src/layouts/` — layouts (autenticado e público).
- `src/shared/` — guards, hooks e enums reutilizados por 2+ features.
- `src/components/ui/` — primitives shadcn/ui (cópias locais).
- `src/lib/` — `cn`, `env`, formatters genéricos.
- `src/test/` — setup MSW + helper `renderWithProviders`.

## Padrões e convenções

Veja [`CLAUDE.md`](./CLAUDE.md) para padrões obrigatórios:

- Tipos da API são gerados; nunca redigite manualmente shapes do schema.
- JWT vive em cookie httpOnly; nunca acesse via JS.
- Roles (Admin/Operador) gateiam UI via `canPerform` / `<RequireRole>` —
  back é fonte de verdade.
- TDD em hooks, guards, parsers, forms e componentes complexos.

## Sincronização com o backend

Toda mudança no contrato:

1. Backend roda `pwsh ../AutoCore/scripts/export-openapi.ps1`.
2. Front roda `npm run api:types`.
3. Cometa `src/api/schema.d.ts` no mesmo PR que consome a mudança.
