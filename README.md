# Trading bot admin portal

React + TypeScript + Vite admin portal for the TradingView → IG trading bot. See [CLAUDE.md](./CLAUDE.md) and [.claude/PROJECT_DOCUMENTATION.md](./.claude/PROJECT_DOCUMENTATION.md) for full project context, API contracts, and design rules.

## Setup

```bash
pnpm install
pnpm dev
```

The API base URL defaults to `http://localhost:3000`. To point at a different backend, create a `.env` file with:

```
VITE_API_BASE_URL=http://your-backend-host:port
```

## Commands

- `pnpm dev` — Vite dev server
- `pnpm build` — type-check and production build
- `pnpm preview` — preview the production build
- `pnpm lint` — oxlint
- `pnpm test` — vitest

## Structure

- `src/api/` — typed Axios calls, one file per backend module
- `src/hooks/` — TanStack Query hooks wrapping the API layer
- `src/context/` — auth session and theme providers
- `src/components/ui/` — design-system primitives (button, card, dialog, table, etc.)
- `src/components/charts/` — Recharts wrappers themed to the design tokens
- `src/components/layout/` — app shell, sidebar, top bar, bot toggle
- `src/pages/` — one folder per route
- `src/routes/` — router, auth/role route guards

## Notes

- No backend exists yet, so authenticated pages will show loading/error or empty states until the NestJS API is running. Endpoint paths for modules not explicitly specified in the project documentation (mapping, rules, trades, system status) are inferred RESTful conventions in `src/api/*.ts` — adjust them to match the real backend once it's built.
- Auth uses an HttpOnly cookie set by the backend (`withCredentials: true` on every request) — never localStorage for tokens.
