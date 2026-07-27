# Trading bot admin portal

React + TypeScript + Vite admin portal for the TradingView → IG trading bot. A private, login-gated SPA for managing stocks, trading conditions, and users, and for reading detailed statistics — global and per-stock.

See [CLAUDE.md](./CLAUDE.md) and [.claude/PROJECT_DOCUMENTATION.md](./.claude/PROJECT_DOCUMENTATION.md) for full project context, API contracts, and design rules. The project documentation is the source of truth; this README is only the entry point.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

### Environment

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MOCK=false
```

**`VITE_API_BASE_URL` must include the `/api` suffix** — the backend mounts every REST route under a global `api` prefix. `src/lib/socket.ts` strips that suffix back off for the Socket.IO connection, since socket.io-client would otherwise read `/api` as a namespace rather than a path.

Two ways to run without the real backend:

- `VITE_MOCK=true` — runs standalone against local mock data via MSW, no backend at all.
- Point `VITE_API_BASE_URL` at a locally running `Trading-view-BOT-BE` (sibling repo).

## Commands

- `pnpm dev` — Vite dev server (port 5173, strict)
- `pnpm build` — type-check (`tsc -b`) and production build
- `pnpm preview` — preview the production build
- `pnpm lint` — oxlint
- `pnpm test` — vitest

## Structure

- `src/api/` — typed Axios calls, one file per backend module. Nothing calls the backend outside this layer
- `src/hooks/` — TanStack Query hooks wrapping the API layer
- `src/context/` — auth session and theme providers
- `src/components/ui/` — design-system primitives (button, card, dialog, table, …)
- `src/components/charts/` — Recharts wrappers themed to the design tokens
- `src/components/common/` — shared app-level pieces (confirm dialog, skeletons, pagination, OTP input)
- `src/components/layout/` — app shell, sidebar, top bar, bot toggle
- `src/pages/` — one folder per route
- `src/routes/` — router and the auth route guard
- `src/mocks/` — MSW handlers + fixtures for `VITE_MOCK=true`

### Routing — import from `react-router`, not `react-router-dom`

The `react-router-dom` package **no longer exists**: v8 removed it (it had only been a v6 compatibility shim). Everything imports from `react-router` — with one exception that matters:

```ts
import { RouterProvider } from 'react-router/dom'   // ← only this one
import { Link, Navigate, Outlet, useNavigate } from 'react-router'
```

`RouterProvider` must come from `react-router/dom`, which wraps the base provider with React DOM's `flushSync`. Both exports are **type-identical**, so importing the wrong one compiles cleanly and fails silently at runtime (view transitions and scroll restoration lose synchronous flushing). `src/routes/router.test.tsx` covers the routing layer but deliberately does *not* catch this — it's called out in that file.

## Pages

| Path | What it is |
|---|---|
| `/login` | Email + password, optional email-OTP 2FA, self-service password reset |
| `/` | Dashboard — global stats, charts, alerts |
| `/stocks`, `/stocks/:ticker` | Per-stock config table, and a per-stock mini-dashboard with its own charts and trading-conditions card |
| `/positions` | Open positions live from IG, plus a confirm-gated **Close all positions** button |
| `/trades` | Full trade history, filterable, CSV export |
| `/conditions` | Global trading rules |
| `/users` | User management |
| `/settings` | Webhook URL, IG status, last signal received, password, 2FA |

## How it talks to the backend

**Auth is an HttpOnly cookie, never localStorage.** Every Axios call sends `withCredentials: true`, and mutating requests carry an `X-CSRF-Token` header read from the non-HttpOnly `csrf_token` cookie (double-submit — see `CsrfGuard` on the backend).

The response interceptor in `src/api/axios.ts` carries most of the session logic, and the distinctions in it are deliberate:

- A 401 on a normal request triggers **one** silent `POST /auth/refresh`, shared across a burst of concurrent failures, then retries the original request.
- A 401 from `/auth/refresh` or `/auth/login` never itself drives a logout or redirect. Refresh tokens are single-use, so a tab that loses the rotation race 401s while the winner has already installed fresh cookies — redirecting on that would log every tab out over a race the retry recovers from.
- The app-load session probe (`getMe({ sessionProbe: true })` in `AuthContext`) gets a 401 as a *normal* answer on any cold visit. It resolves to "logged out" and lets `ProtectedRoute` navigate to `/login`, rather than forcing a page reload mid-boot.
- Only a session that dies *under* the user forces `window.location.assign('/login')`.

Realtime updates (trades, rules changes, IG connection status, open positions) arrive over Socket.IO, not polling — see `src/lib/socket.ts` and `src/hooks/useSocketEvent.ts`. The socket authenticates with the same cookie and is connected/disconnected in step with the logged-in user.

## Conventions worth knowing

- **No P&L, anywhere.** Not "no real-time P&L" — literally none. A realized-P&L feature was built and removed app-wide because the numbers weren't trustworthy. Don't re-add any form of it without discussing first; the portal shows what was invested, not a return.
- **19 trade statuses**, each with its own badge colour. Don't invent statuses or collapse them. Several (`MARKET_CLOSED`, `NO_POSITION`, `GLOBAL_POSITION_LIMIT`, `COOL_DOWN`, `MAX_POSITIONS_STOCK`) are legacy-only — nothing writes them any more, but historical rows still carry them, so their badges stay.
- **No roles.** Every authenticated user sees and edits everything. An earlier ADMIN/VIEWER split was deliberately removed.
- **Theme tokens, never hardcoded colours.** Everything must work in both dark and light themes.
- **Every destructive action confirms**, and loading states are skeletons rather than spinners.
- The "Send test signal" flask icon only renders when `systemStatus.testSignalsEnabled` is true. It places **real IG orders** — never remove that gate.

## Deployment

Push to `main` runs `.github/workflows/ci.yml`: lint → build → test → `pnpm audit --audit-level=high`, then runs `.claude/scripts/deploy.sh` over SSH. Deploy targets are Nginx on the EC2 instance or Cloudflare Pages.

**Not Vercel** — its free Hobby plan is non-commercial only, and this is a paid client project.

### Package manager and lockfiles

`pnpm` only, at the version pinned in `package.json`'s `packageManager` field — CI's `pnpm/action-setup` reads it, and pnpm itself fetches that version on the deploy box, so all three environments stay in step. Bump it there, not in the workflow.

`pnpm-lock.yaml` is the **only** lockfile. `package-lock.json` and `yarn.lock` are gitignored on purpose: nothing in CI or deploy reads them, but GitHub's dependency graph and Dependabot do, so a stale one raises alerts for packages the project no longer has. One committed here did exactly that, still pinning `react-router-dom@7.18.1` after the v8 migration removed it.

The audit reads `pnpm-lock.yaml`, so `pnpm audit --audit-level=high` locally gives you CI's answer. Fix a transitive advisory with an `overrides:` entry in `pnpm-workspace.yaml` — pnpm ignores `package.json`'s `overrides`, and since v11 the `pnpm.overrides` key too.

## Further reading

- [CLAUDE.md](./CLAUDE.md) — working rules, design direction, hard constraints
- [.claude/PROJECT_DOCUMENTATION.md](./.claude/PROJECT_DOCUMENTATION.md) — full specification (source of truth)
- [.claude/rules.md](./.claude/rules.md) — design tokens, component and UX rules
- [.claude/README.md](./.claude/README.md) — what the `.claude/` tooling does
