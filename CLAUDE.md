# CLAUDE.md — Frontend (React Admin Portal)

This file gives Claude Code the context and rules for the trading bot admin portal frontend. Read it fully before making changes.

---

## Project documentation reference

The full project documentation lives at `.claude/PROJECT_DOCUMENTATION.md`. Read the relevant sections before working on any feature. Do not guess about API contracts, data shapes, or business logic — the answers are in that file.

### Which sections to read for each area of work

| Working on | Read sections |
|---|---|
| Auth pages (login, 2FA setup) | Section 5 (Security), Section 6 (User Management), Section 10 AuthModule endpoints |
| Dashboard page | Section 12 (Dashboard & Statistics) — all stat cards + chart requirements |
| Stocks page / Add stock modal | Section 10 MappingModule endpoints, Section 15 IG search endpoint |
| Stock detail page `/stocks/:ticker` | Section 12 per-stock statistics — all required charts and stat cards |
| Trades page | Section 8 trade_log schema — every column + all 16 status values + their meaning |
| Conditions page | Section 9 (Trading Conditions) — every global rule explained |
| Users page | Section 6 (User Management) — create flow, roles, endpoints |
| Settings page | Section 5 Layer 3 (webhook), Section 7 (secrets) |
| API layer | Section 10 (Backend modules) — every endpoint with method, path, auth required |
| Trade status badges | Section 8 trade_log status values — all 16 statuses and their meaning |
| Bot ON/OFF toggle | Section 8 trading_rules schema — bot_enabled field |

### Most important things to know from the documentation

- There are 16 possible trade statuses (Section 8 trade_log). Every status needs its own badge colour — do not invent statuses or collapse them.
- The bot master switch (`bot_enabled` in `trading_rules`) must be one click from anywhere — top bar always.
- Real-time P&L from IG is NOT possible (Section 19 Limitation 1). The portal shows what was invested, not current value. Do not design or imply live P&L.
- Auth uses HttpOnly cookie — `withCredentials: true` on every Axios call. Never localStorage.
- Two roles: ADMIN sees everything; VIEWER sees dashboard, trades, stats — read only. Gate accordingly.
- The per-stock detail page `/stocks/:ticker` is a mandatory, fully featured mini-dashboard with five chart types and a stat row (Section 12).

---

## What this project is

The admin portal for the TradingView → IG trading bot. A private, login-gated single-page app where the client manages stocks, trading conditions, users, and views detailed statistics with charts (global and per-stock). It talks to the NestJS backend via REST.

This is a financial tool. Clarity, correctness, and a calm, trustworthy UI matter more than flashiness.

## Tech stack

- React + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- shadcn/ui (component primitives)
- Recharts (charts)
- Axios (API client, with interceptors)
- React Router (routing)
- TanStack Query (server state / data fetching) — optional but preferred for caching

## Design direction — 2026 futuristic, simple UX

- **Dark-first** theme with a light toggle. Deep near-black background, elevated frosted card surfaces.
- **One accent color** (electric teal-cyan or violet). Used for primary actions, active states, chart highlights. Not rainbow.
- **Data-forward.** Charts and big readable numbers are the hero. Chrome stays minimal.
- **Glassmorphism, sparingly.** Subtle frosted surfaces, soft borders, 12–16px radius.
- **Subtle motion.** Fade/slide-in on load, smooth number count-ups on stat cards, gentle hovers. No gratuitous animation.
- **Simple UX.** One primary action per screen. Max 2 clicks to anything. No deep nested menus.
- **Bot ON/OFF toggle always visible** in the top bar — the most important control.

## Pages

- `/login` — email + password + 2FA code
- `/` — dashboard: global stats cards + charts + alerts
- `/stocks` — per-stock config table; click a row → stock detail
- `/stocks/:ticker` — single-stock statistics with charts (this is required and important)
- `/trades` — full trade history, filterable, CSV export
- `/conditions` — global trading rules form
- `/users` — user management (Admin only)
- `/settings` — webhook URL, IG status, change password, manage 2FA

## Hard rules

1. **No secrets in the frontend.** No API keys, no IG credentials. The frontend only talks to our backend.
2. **Auth via HttpOnly cookie.** The JWT is in an HttpOnly cookie set by the backend. Do NOT store tokens in localStorage. Axios sends the cookie automatically (`withCredentials: true`).
3. **On 401, redirect to /login.** Axios response interceptor handles this globally.
4. **Role-gate the UI.** Hide admin-only pages/actions (Users, settings changes) from VIEWER role. But remember the backend enforces this too — the UI gate is UX, not security.
5. **Every destructive action confirms.** Delete user, disable stock, etc. → confirm dialog.
6. **Round every displayed number.** Money to 2dp, percentages to 1dp, counts as integers. No floating-point artifacts on screen.
7. **Loading = skeletons, not spinners**, for a smoother feel.
8. **Accessible.** Use shadcn/ui primitives, keyboard navigable, sufficient contrast in both themes.

## Code style

- Functional components + hooks only.
- One component per file. Co-locate small subcomponents.
- TypeScript strict. Type all props and API responses.
- Centralize API calls in `src/api/` — one file per backend module (auth, users, mapping, trades, stats, rules).
- Use TanStack Query for server data; keep local UI state in useState/useReducer.
- Tailwind for styling; use design tokens (CSS variables) for theme colors, not hardcoded hex.
- Charts: Recharts, accent color, muted gridlines, hover tooltips, animate-in on load.

## API layer

- `src/api/axios.ts` — Axios instance with `withCredentials: true`, request/response interceptors (401 → /login).
- One module file per domain. Typed request and response interfaces.
- Never call fetch/axios directly inside components — go through the api layer (optionally wrapped in a TanStack Query hook).

## Commands

- `pnpm install`
- `pnpm dev` — Vite dev server
- `pnpm build` — production build
- `pnpm preview` — preview the build
- `pnpm lint`
- `pnpm test`

## Before a task is done

1. `pnpm build` compiles
2. `pnpm lint` passes
3. Works in both dark and light themes
4. Role-gating correct (VIEWER cannot see admin actions)
5. Numbers rounded, loading states present, destructive actions confirmed

## Don't

- Don't store JWTs in localStorage/sessionStorage.
- Don't hardcode colors — use theme tokens.
- Don't call the backend outside the api layer.
- Don't add Vercel-specific code — this deploys to Nginx or Cloudflare Pages.
- Don't over-animate. Calm and trustworthy beats flashy.
