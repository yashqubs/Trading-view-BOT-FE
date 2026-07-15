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
| Trades page | Section 8 trade_log schema — every column + all 17 status values + their meaning |
| Conditions page | Section 9 (Trading Conditions) — every global rule explained |
| Users page | Section 6 (User Management) — create flow, endpoints |
| Settings page | Section 5 Layer 3 (webhook), Section 7 (secrets), Section 10 SystemModule (last signal received) |
| API layer | Section 10 (Backend modules) — every endpoint with method, path, auth required |
| Trade status badges | Section 8 trade_log status values — all 17 statuses and their meaning |
| Bot ON/OFF toggle | Section 8 trading_rules schema — bot_enabled field |
| Realtime / sockets | Section 10 RealtimeModule — event names and payloads |

### Most important things to know from the documentation

- There are 17 possible trade statuses (Section 8 trade_log), including `DUPLICATE_SIGNAL`. Every status needs its own badge colour — do not invent statuses or collapse them. `MARKET_CLOSED` is legacy-only (the markets/trading-hours feature was removed; historical rows still carry it, so keep its badge).
- The bot master switch (`bot_enabled` in `trading_rules`) must be one click from anywhere — top bar always.
- No P&L is shown in the portal — not "no real-time P&L", literally none (Section 19 Limitation 1). A realized-P&L feature (computed from signal price, not IG's fill price) was built and then removed app-wide because the numbers weren't trustworthy. Don't re-add any form of P&L display without discussing it first — the portal shows what was invested, not a return figure.
- Auth uses HttpOnly cookie — `withCredentials: true` on every Axios call, plus an `X-CSRF-Token` header (read from the `csrf_token` cookie) on mutating requests. Never localStorage.
- Only one device can be logged into an account at a time (Section 5 Layer 4, backend-enforced) — logging in elsewhere invalidates the current session, surfacing here as a plain 401 that the existing Axios interceptor already redirects to `/login`. No special frontend handling needed unless a future task asks for a distinct "logged in elsewhere" message.
- No roles: every authenticated user sees and edits everything. An earlier ADMIN/VIEWER split was deliberately removed — don't reintroduce role gating.
- The per-stock detail page `/stocks/:ticker` is a mandatory, fully featured mini-dashboard with five chart types and a stat row (Section 12) — plus its own "Trading conditions" card so a stock's settings can be managed without leaving the page.
- Execution mode (Market price vs. Signal price) has a global default on the Conditions page and an optional per-stock override on the stock detail page — both use the shared `ExecutionModeToggle` component (Section 9 "Execution Mode"), not a plain Switch, since it's a named-mode choice.
- Realtime updates come over a Socket.IO connection (`src/lib/socket.ts`, `useSocketEvent`), not polling — see Section 10 RealtimeModule for the event list.
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
- **One accent color** (electric teal-cyan or violet). Used for primary actions, active states, chart highlights. Not rainbow.
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
- `/positions` — currently open positions, live from IG
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
