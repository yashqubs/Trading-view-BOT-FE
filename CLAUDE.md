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
| Trades page | Section 8 trade_log schema — every column + all 19 status values + their meaning; Section 10 "Trade history status filter" for the per-page status defaults |
| Conditions page | Section 9 (Trading Conditions) — every global rule explained |
| Users page | Section 6 (User Management) — create flow, endpoints |
| Settings page | Section 5 Layer 3 (webhook), Section 7 (secrets), Section 10 SystemModule (last signal received) |
| API layer | Section 10 (Backend modules) — every endpoint with method, path, auth required |
| Trade status badges | Section 8 trade_log status values — all 19 statuses and their meaning |
| Bot ON/OFF toggle | Section 8 trading_rules schema — bot_enabled field |
| Realtime / sockets | Section 10 RealtimeModule — event names and payloads |

### Most important things to know from the documentation

- There are 19 possible trade statuses (Section 8 trade_log), including `DUPLICATE_SIGNAL`, `ALREADY_LONG`, and `ALREADY_SHORT`. Every status needs its own badge colour — do not invent statuses or collapse them. Five are legacy-only: `MARKET_CLOSED` and `NO_POSITION` (the markets/trading-hours feature was removed, and short selling means a SELL with no position now opens a short rather than skipping), plus `GLOBAL_POSITION_LIMIT`, `COOL_DOWN`, and `MAX_POSITIONS_STOCK` (those throttles were removed). Nothing writes any of them now, but historical rows still carry them — keep their badges.
- The bot master switch (`bot_enabled` in `trading_rules`) must be one click from anywhere — top bar always.
- No P&L is shown in the portal — not "no real-time P&L", literally none (Section 19 Limitation 1). A realized-P&L feature (computed from signal price, not IG's fill price) was built and then removed app-wide because the numbers weren't trustworthy. Don't re-add any form of P&L display without discussing it first — the portal shows what was invested, not a return figure.
- Auth uses HttpOnly cookie — `withCredentials: true` on every Axios call, plus an `X-CSRF-Token` header (read from the `csrf_token` cookie) on mutating requests. Never localStorage.
- Only one device can be logged into an account at a time (Section 5 Layer 4, backend-enforced) — logging in elsewhere invalidates the current session, surfacing here as a plain 401 that the existing Axios interceptor already redirects to `/login`. No special frontend handling needed unless a future task asks for a distinct "logged in elsewhere" message.
- **Not every 401 means the session died** — `src/api/axios.ts` draws three distinctions on purpose, and collapsing them back into one has caused real bugs. (1) A 401 from `/auth/refresh` or `/auth/login` never drives a logout or redirect: refresh tokens are single-use, so a tab losing the rotation race 401s while the winner has already installed fresh cookies. (2) The app-load probe — `getMe({ sessionProbe: true })` in `AuthContext` — treats 401 as the normal "not logged in" answer and lets `ProtectedRoute` navigate reactively; forcing `window.location.assign` there reloaded the page mid-boot on every return visit after the session lapsed. (3) Only a session dying *under* the user forces the hard navigation. See Section 5 Layer 4 "Session recovery".
- The **Close all positions** button on `/positions` closes every position open on IG — not just the filtered rows — so the confirm dialog says so explicitly whenever a search/direction/ticker filter is narrowing the list, and only quotes a count when it isn't. A partial result (`{ attempted, closed, failures[] }`) is a normal outcome, not an error: name each instrument still open and run its raw IG code through `explainTradeError`, because "closed 3 of 5" alone leaves the user with live exposure and no idea which.
- **The two trade tables have different default status filters, on purpose**: `/trades` shows **all statuses** (it's the full-history page — hiding most rows by default was surprising there, so the 2026-07-27 "Executed only" default was reverted on 2026-08-01), while a stock's own trade table on `/stocks/:ticker` still defaults to **"Executed only" (SUCCESS + FAILED)** since it sits under stat cards and charts that are themselves about executions. `StatusCombobox` is the one shared component both pages use (three tiers: Executed only / All statuses / a specific status); don't reintroduce a separate flat `<Select>` for status filtering. Its `baseline` prop (default `'ALL'`) is what deselecting a status reverts to — `StockDetail` passes `'EXECUTED'`. The backend accepts a comma-separated `status` list (`GET /trades?status=SUCCESS,FAILED`) for the executed-only view — see Section 10 "Trade history status filter". Each page's own default is its baseline: `hasActiveFilters` must not count it, and "Clear filters" must return to it.
- No roles: every authenticated user sees and edits everything. An earlier ADMIN/VIEWER split was deliberately removed — don't reintroduce role gating.
- The per-stock detail page `/stocks/:ticker` is a mandatory, fully featured mini-dashboard with five chart types and a stat row (Section 12) — plus its own "Trading conditions" card so a stock's settings can be managed without leaving the page.
- Execution mode (Market price vs. Signal price) has a global default on the Conditions page and an optional per-stock override on the stock detail page — both use the shared `ExecutionModeToggle` component (Section 9 "Execution Mode"), not a plain Switch, since it's a named-mode choice.
- Realtime updates come over a Socket.IO connection (`src/lib/socket.ts`, `useSocketEvent`), not polling — see Section 10 RealtimeModule for the event list.
- **Routing is `react-router` v8 — the `react-router-dom` package no longer exists** (v8 removed it; it was only ever a v6 compatibility shim). Import everything from `react-router`, **except `RouterProvider`, which must come from `react-router/dom`**. The two exports are type-identical, so importing the wrong one compiles cleanly and only differs at runtime — the DOM build injects React DOM's `flushSync`, which synchronous flushing (view transitions, scroll restoration) depends on. `src/routes/router.test.tsx` smoke-covers the routing layer; it explicitly does not catch this particular mistake, so review it by eye.
- The "Send test signal" flask icon (Stocks list + stock detail page) only renders when `systemStatus.testSignalsEnabled` is true — it calls `POST /signal/test`, which runs the real pipeline and can place a real IG order. Never remove that gate or show it unconditionally. Its result includes a "Raw IG API exchange" panel (`igDebug` in the response) showing the exact request/response bodies IG returned for that signal — dev-only visibility for verifying IG's actual behavior instead of guessing from docs.

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
- **One accent color** — **indigo-blue** (`#5666f5` dark / `#3548f3` light), which replaced the earlier teal-cyan/violet direction. Used for primary actions, active states, chart highlights. Not rainbow; only the `--stat-*` palette is multi-hued, and only for stat-card icons and chart series. `src/index.css` is the source of truth for exact values.
- **Data-forward.** Charts and big readable numbers are the hero. Chrome stays minimal.
- **Glassmorphism, sparingly.** Subtle frosted surfaces, soft borders, 12–16px radius.
- **Subtle motion.** Fade/slide-in on load, smooth number count-ups on stat cards, gentle hovers. No gratuitous animation.
- **Simple UX.** One primary action per screen. Max 2 clicks to anything. No deep nested menus.
- **Bot ON/OFF toggle always visible** in the top bar — the most important control.

## Pages

- `/login` — email + password + optional email-OTP 2FA code
- `/` — dashboard: global stats cards + charts + alerts
- `/stocks` — per-stock config table; click a row → stock detail
- `/stocks/:ticker` — single-stock statistics with charts, plus a "Trading conditions" card to manage that stock's settings without leaving the page (this is required and important)
- `/positions` — currently open positions, live from IG, plus a confirm-gated "Close all positions" button
- `/trades` — full trade history, filterable, CSV export
- `/conditions` — global trading rules form
- `/users` — user management
- `/settings` — webhook URL, IG status, last TradingView signal received, change password, manage 2FA

## Hard rules

1. **No secrets in the frontend.** No API keys, no IG credentials. The frontend only talks to our backend.
2. **Auth via HttpOnly cookie.** The JWT is in an HttpOnly cookie set by the backend. Do NOT store tokens in localStorage. Axios sends the cookie automatically (`withCredentials: true`).
3. **On 401, redirect to /login.** Axios response interceptor handles this globally.
4. **Every destructive action confirms.** Delete user, disable stock, etc. → confirm dialog.
5. **Round every displayed number.** Money to 2dp, percentages to 1dp, counts as integers. No floating-point artifacts on screen.
6. **Loading = skeletons, not spinners**, for a smoother feel.
7. **Accessible.** Use shadcn/ui primitives, keyboard navigable, sufficient contrast in both themes.

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
5. Numbers rounded, loading states present, destructive actions confirmed

## Don't

- Don't store JWTs in localStorage/sessionStorage.
- Don't hardcode colors — use theme tokens.
- Don't call the backend outside the api layer.
- Don't add Vercel-specific code — this deploys to Nginx or Cloudflare Pages.
- Don't over-animate. Calm and trustworthy beats flashy.
