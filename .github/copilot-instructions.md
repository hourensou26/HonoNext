# Copilot instructions for this repository

## Project layout

This repo has two independent Node/TypeScript apps (not a workspace):

1. `study/` - Hono + SQLite backend API
2. `study-front/` - Next.js App Router frontend

Run commands from the app directory you are working in.

## Build, lint, and dev commands

### Backend (`study`)

```bash
cd study
npm install
npm run dev
npm run lint
npm run lint:fix
```

No `build` or `test` script is currently defined in `study/package.json`.

### Frontend (`study-front`)

```bash
cd study-front
npm install
npm run dev
npm run build
npm run lint
npm run lint:fix
```

No `test` script is currently defined in `study-front/package.json`, so there is no single-test command available yet.

## High-level architecture

### Backend (`study`)

- Entry point is `src/server.ts`, which serves the OpenAPI Hono app from `src/index.ts`.
- `src/index.ts` mounts todo routes at `/api/v1/todos`, enables CORS, and exposes docs at:
  - `/openapi.json`
  - `/docs`
- Todo feature is layered under `src/features/todos/`:
  - `routes.ts` (OpenAPI route definitions via `@hono/zod-openapi`)
  - `controller.ts` (HTTP handling + response shaping)
  - `service.ts` (business logic)
  - `repository.ts` (SQLite access via `better-sqlite3`, DB file `todos.db`)
  - `types.ts` (Zod schemas, DTO types, OpenAPI schemas)
- API responses follow shared wrappers (`src/features/shared/types/ApiResponse.ts`): success `{ data, statusCode }`, error `{ error, statusCode, details? }`.
- Request/response flow for Todo endpoints is: **route schema (`routes.ts`) -> controller (`controller.ts`) -> service (`service.ts`) -> repository (`repository.ts`) -> DTO mapping (`types.ts`) -> response envelope**.
- `routes.ts` uses `createRoute(...)` + `todoRoutes.openapi(...)`; endpoint contracts should be declared there first so `/openapi.json` and `/docs` stay aligned with runtime behavior.
- `types.ts` is the contract source for:
  - request validation schemas (`createTodoDtoSchema`, `updateTodoDtoSchema`, `todoIdParamSchema`)
  - OpenAPI response schemas (`todoSuccessResponseSchema`, `errorResponseSchema`, etc.)
  - DTO conversion (`toTodoResponseDto`, `toTodoResponseDtoList`)
- `repository.ts` initializes the `todos` table on module load and normalizes DB rows through `todoSchema.parse(...)` (including `completed` int -> boolean transform). Keep this parse step when changing DB columns/types.
- `service.ts` is where cross-request business behavior belongs (default description, existence checks, status toggle logic), while `controller.ts` should stay focused on HTTP concerns and status mapping.

### Frontend (`study-front`)

- Uses Next.js App Router (`app/`), with route files kept thin and delegating UI/logic to `features/`.
- Root route redirects to `/todos` (`app/page.tsx`).
- Feature-first structure in `features/` (`todos`, `todo`, `create`, `update`, `delete`) with consistent subfolders:
  - `api/` fetchers
  - `hooks/` client-side state/data loading
  - `components/` UI
  - `types/` feature-specific types
  - `utils/` formatters/transformers
  - server actions where needed (`create/actions/action.ts`, `update/action/action.ts`)
- Shared OpenAPI typing flow:
  - `openapi/schema.d.ts` is generated from backend OpenAPI (do not hand-edit).
  - `openapi/client.ts` creates a typed `openapi-fetch` client.
  - `shared/types/index.ts` and feature `types/` derive types directly from OpenAPI `paths`.
- MDX is a first-class page surface:
  - `next.config.ts` enables MDX + `remark-gfm`, and styled-components compiler support.
  - `markdown/README.mdx` provides content rendered by `app/mdx-page/page.tsx`.
  - `mdx-components.tsx` + `shared/components/Mdx/markdownComponents.tsx` provide MDX component mapping/styling.

## Key repository conventions

- **Important Next.js rule from existing assistant config (`study-front/AGENTS.md`):** before implementing framework-specific behavior, read relevant docs in `study-front/node_modules/next/dist/docs/` because this project uses a Next version with breaking changes vs older conventions.
- Path alias `@/*` is used across frontend (`study-front/tsconfig.json`); prefer alias imports over deep relative paths.
- Keep frontend route files in `app/` minimal; place behavior in `features/*`.
- For API contract changes, update backend route/type schemas in `study/src/features/todos/types.ts` and `routes.ts` first, then regenerate/update frontend OpenAPI artifacts before changing feature types.
- Preserve the repository’s API response envelope (`data/statusCode` or `error/statusCode`) and continue using formatter helpers in `features/*/utils` to normalize UI-facing shapes.
