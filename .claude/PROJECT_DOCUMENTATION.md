# TradingView → IG Trading Bot
## Technical Documentation
### Prepared for: Yash Modi (Developer) | Smit Patel (Architecture / Infra) | Vipul Patel (Client)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Prerequisites & Blockers](#4-prerequisites--blockers)
5. [Security Architecture](#5-security-architecture)
6. [User Management](#6-user-management)
7. [Environment Variables & Secrets](#7-environment-variables--secrets)
8. [Database Schema](#8-database-schema)
9. [Trading Conditions & Rules](#9-trading-conditions--rules)
10. [Backend — NestJS](#10-backend--nestjs)
11. [Frontend — React](#11-frontend--react)
12. [Dashboard & Statistics](#12-dashboard--statistics)
13. [UI / UX Design Direction](#13-ui--ux-design-direction)
14. [TradingView Configuration](#14-tradingview-configuration)
15. [IG API Reference — Endpoints To Implement](#15-ig-api-reference--endpoints-to-implement)
16. [AWS Infrastructure](#16-aws-infrastructure)
17. [Backup & Disaster Recovery](#17-backup--disaster-recovery)
18. [Deployment Checklist](#18-deployment-checklist)
19. [Known Limitations & Not Doable Items](#19-known-limitations--not-doable-items)

---

## 1. Project Overview

An automated trading bot that listens to real-time signals from TradingView indicators via webhook, translates them into executable orders on the IG broker REST API, and logs all activity to an admin portal where the client manages stocks, investment amounts, trading conditions, users, and views detailed statistics per stock.

### What This System Does

When a TradingView indicator fires a green (buy) or red (sell) signal, the bot automatically executes the trade on IG without manual intervention. Everything is managed through a modern admin portal — per-stock amounts, global trading rules, user accounts, and full statistics with charts.

### Trading Strategy Context

| Item | Detail |
|---|---|
| Signal source | TradingView premium account — Profit Investment and UTBots indicators |
| Signal types | Binary only — BUY or SELL |
| Chart interval | Daily (signals valid for the full trading day) |
| Acceptable delay | 1 to 10 minutes between signal and execution |
| Broker | IG — Spread Betting account (Daily Funded Bets / "DFB") — not CFD |
| Markets traded | US equities only — NASDAQ and NYSE |
| Testing phase | IG demo account first, then live |
| Stock universe | Approximately 60 to 70 stocks |

### End-to-End Flow

```
1.  TradingView indicator fires (green = BUY / red = SELL)
2.  TradingView sends webhook POST to the bot server
3.  Server verifies request is from a known TradingView IP
4.  Server validates the secret key in the payload
5.  Bot parses signal — ticker, direction, price
6.  Bot checks global trading rules (enabled? daily limits?)
7.  Bot looks up ticker in mapping table → IG Epic code
8.  Bot checks per-stock conditions (enabled? daily spend cap?)
9.  Bot checks if US market is open
10. Bot calculates size = floor((investment amount ÷ price-in-points) × 100) / 100 — a £/point stake, not a share count
11. Bot calls IG REST API to place the trade
12. IG executes and returns deal reference
13. Bot confirms deal and logs result to database
14. Admin portal updates — statistics, charts, history
```

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend framework | NestJS (TypeScript) | Modular, matches Quantum Hub stack |
| ORM | TypeORM | Native NestJS support |
| Database | PostgreSQL 18 on EC2 (self-hosted) | Ubuntu 26.04 LTS default; cost saving; backup strategy (see Section 17) |
| HTTP client | NestJS Axios module | IG API calls |
| Authentication | JWT + bcrypt + optional email-OTP 2FA | Portal login security |
| Realtime | Socket.IO (NestJS WebSocket gateway) | Pushes trade/rules/position/system-status updates to the portal — replaces polling |
| Secrets | AWS Secrets Manager | IG credentials never on disk |
| Rate limiting | NestJS Throttler | Brute force / DoS protection |
| Security headers | Helmet.js | HTTP security headers |
| Dependency scanning | npm audit + Dependabot | Catch vulnerable packages |
| Scheduler | NestJS Schedule | IG token refresh, backups |
| Frontend | React + TypeScript + Vite | SPA admin portal |
| Styling | TailwindCSS | Utility-first, fast |
| Charts | Recharts | Per-stock and global statistics |
| UI components | shadcn/ui | Modern accessible primitives |
| Frontend hosting | Nginx on same EC2 OR Cloudflare Pages | Both free (see Section 16) |
| Deployment | AWS EC2 (Ubuntu 26.04 LTS) | Single instance for bot + DB |
| Runtime | Node.js 24 LTS | Active LTS; matches NestJS requirements |
| Process manager | PM2 | Keep NestJS alive |
| Reverse proxy | Nginx + Certbot | HTTPS (required by TradingView) |

> Note on frontend hosting: Vercel's free Hobby plan is non-commercial only and cannot be used for this paid client project. Use Nginx on the same EC2 instance (zero extra cost) or Cloudflare Pages (free, allows commercial use). React + Vite is used rather than Next.js because this is a private login-gated portal where server-side rendering and SEO bring no benefit.

---

## 3. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                    TRADINGVIEW                         │
│   Premium + 2FA + Webhook alert + Known IPs only       │
└───────────────────────┬────────────────────────────────┘
                        │  HTTPS POST — ports 80/443 only
                        ↓
┌────────────────────────────────────────────────────────┐
│             AWS EC2 — NestJS Bot Server                │
│  ┌──────────────────────────────────────────────┐     │
│  │  SECURITY LAYER                              │     │
│  │  IP Whitelist → Rate Limiter → Secret Key    │     │
│  │  Helmet → CORS → Input Validation → 2FA       │     │
│  └───────────────────────┬──────────────────────┘     │
│                          ↓                            │
│  Webhook → Signal → Trading Rules → Mapping            │
│                          ↓                            │
│  Trade Module ───────────────────→ IG REST API         │
│                          ↓                            │
│  Stats Module ←── Trade Log (PostgreSQL on disk)       │
│                                                        │
│  Auth + User Mgmt + Portal Modules                     │
│  Scheduler (token refresh + nightly backup)            │
│  Secrets fetched from AWS Secrets Manager at boot      │
└────────────────────────────────────────────────────────┘
        │                              │
        ↓                              ↓
┌──────────────────────┐   ┌──────────────────────────────┐
│  PostgreSQL (EC2)    │   │  AWS Secrets Manager         │
│  Encrypted EBS disk  │   │  IG creds, JWT secret, etc.  │
│  Nightly → S3 backup │   └──────────────────────────────┘
└──────────────────────┘
        │
        ↓
┌──────────────────────┐
│  S3 (encrypted)      │
│  Daily DB dumps      │
│  EBS daily snapshots │
└──────────────────────┘
```

---

## 4. Prerequisites & Blockers

### Vipul Must Complete

| # | Action | Why It Blocks |
|---|---|---|
| 1 | Confirm IG demo is linked to a live account | API keys cannot be created from standalone demo |
| 2 | Generate an IG API key (My IG → Settings → API) | Needed to authenticate all IG calls |
| 3 | Enable 2FA on TradingView | Required to unlock the webhook URL field |
| 4 | Change alert message format to JSON (Section 14) | Plain text cannot be parsed |
| 5 | Send Yash IG demo + TradingView logins | Needed for testing |

### Smit Must Complete

| # | Action | Why It Blocks |
|---|---|---|
| 6 | Provision EC2 with encrypted EBS volume | Server + database host |
| 7 | Create AWS Secrets Manager secrets | IG credentials storage |
| 8 | Create S3 bucket (encrypted) for backups | Disaster recovery |
| 9 | Create IAM user/role for Yash | Deployment access |

### Team Decisions

| # | Question | Recommended |
|---|---|---|
| 10 | SELL signal with no open position? | ~~Skip, log NO_POSITION~~ — **superseded 2026-07-16**: now opens a short instead (see "Short Selling" in Section 9) |
| 11 | Signal when market closed? | No check — the markets/trading-hours feature was removed. The order goes to IG; if IG rejects it, it's logged FAILED |
| 12 | Stop-loss orders? | No for v1 — manual on IG |

---

## 5. Security Architecture

> Six layers. Every measure addresses a specific attack vector. Points 1–5 from the security review (2FA, Secrets Manager, EBS encryption, S3 encryption, dependency scanning) are now implemented and documented below.

### Layer 1 — Network Security (AWS)

| Control | Configuration | Reason |
|---|---|---|
| EC2 HTTPS inbound | Port 443 from anywhere | TradingView + portal access |
| EC2 HTTP inbound | Port 80 from anywhere | Nginx redirect + Certbot renewal |
| EC2 SSH inbound | Port 22 from Yash + Smit IPs only | Prevent SSH brute force |
| PostgreSQL | Localhost only (127.0.0.1) | DB never exposed to internet |
| **EBS encryption** | **Enabled at volume creation** | **Disk data encrypted at rest (IMPLEMENTED)** |
| SSH auth | Key-based only, passwords disabled | No password brute force |
| Fail2ban | Auto-ban repeated SSH failures | Active intrusion prevention |

### Layer 2 — Application Security (NestJS)

| Control | What It Prevents |
|---|---|
| Helmet.js headers (CSP, HSTS, X-Frame-Options, etc.) | XSS, clickjacking, MIME sniffing |
| CORS — portal domain only | Cross-site API abuse |
| Rate limiting (per endpoint) | Brute force, DoS |
| Payload size limit (10KB) | Memory exhaustion |
| Input validation (class-validator) | Malformed / injection payloads |
| **npm audit + Dependabot** | **Known vulnerable dependencies (IMPLEMENTED)** |

#### Dependency Scanning (Implemented)

- `npm audit` runs in CI on every push and fails the build on high/critical vulnerabilities
- Dependabot is enabled on the GitHub repo (`.github/dependabot.yml`) — opens automatic PRs for vulnerable or outdated packages weekly
- A `pnpm audit --audit-level=high` pre-deploy check is part of the deployment script

### Layer 3 — Webhook Security (Double Validation)

| Check | Detail |
|---|---|
| TradingView IP whitelist | Only 52.89.214.238, 34.212.75.30, 54.218.53.128, 52.32.178.7 accepted |
| Secret key validation | `secret` field in payload must match the stored secret |
| Async processing | Returns 200 within 3 seconds (TradingView requirement), processes in background |

> The webhook secret is now fetched from AWS Secrets Manager, not from a .env file.

### Layer 4 — Authentication Security (Portal)

| Control | Value | Reason |
|---|---|---|
| Password hashing | bcrypt cost 12 | Plain text never stored |
| **2FA (email OTP)** | **Optional, user opt-in (IMPLEMENTED)** | **Stolen password alone is not enough, for accounts that enable it** |
| JWT expiry | 15 min access token (also 15 min for the pending session while a password change is required) | Limits exposure window |
| Refresh token | Opaque, hashed in DB, 1h sliding idle window — `POST /auth/refresh` rotates it (single-use) and reissues both cookies. Not issued for pending sessions. | Keeps an *active* user logged in without a long-lived access token; a genuinely idle user (no requests for 1h) is logged out |
| Token storage | HttpOnly + Secure + SameSite=Strict cookie | Prevents XSS theft + CSRF |
| CSRF double-submit token | `X-CSRF-Token` header must match the `csrf_token` cookie on every mutating request | Defense in depth alongside SameSite=Strict |
| Brute force lockout | 5 attempts / 15 min then locked | Stops password guessing |
| Token blacklist | Invalidated on logout | Stolen token cannot be reused |
| **Single active session (IMPLEMENTED)** | **One login per account at a time** — signing in on a new device immediately ends every other device's session | A leaked/stolen session can't quietly persist alongside the real user's |
| **Session recovery (IMPLEMENTED)** | A lapsed session always self-heals — the backend clears dead cookies, and not every 401 is treated as session death | A user returning after a gap must never be stuck; see below |

#### 2FA Implementation (Implemented)

> Note: this replaced an earlier TOTP/QR-code design during implementation — email-OTP is what's actually built. If you're reading older notes that mention an authenticator app or recovery codes, they're stale.

- Two-factor authentication is **optional**: after the forced first-login password change, the user is asked whether to enable it, and can enable/disable it any time from Settings
- When enabled, a 6-digit code is emailed to the user's address on every login. Enabling/disabling from Settings is a plain toggle — no confirmation code (product decision 2026-07-10; note the trade-off: enabling no longer proves email delivery works, so a user with a broken email address can lock themselves out at the next login)
- Codes expire after 10 minutes, can be resent after a 30-second cooldown, and lock out after 5 wrong attempts (forcing a resend)
- Disabling 2FA is likewise immediate for a logged-in session — no password re-entry
- Only a salted hash of the current OTP is stored, with a short expiry — there is no long-lived secret to protect (unlike the TOTP approach this replaced), so nothing OTP-related needs encryption at rest

#### Single-Session Enforcement (Implemented)

- Only one device/browser can be logged into an account at a time. Logging in anywhere — password-only, or password+2FA, or the forced-password-change flow on first login — immediately ends every other active session for that account, no confirmation step, no "log out other devices" button needed.
- From the frontend's point of view this needs no special handling: the kicked-out device just gets a 401 on its next request (even mid-session, before its token would otherwise have expired), which the Axios response interceptor turns into a redirect to `/login` — see `src/api/axios.ts` and "Session recovery" below for exactly which 401s do that. There's currently no toast distinguishing "you were logged in elsewhere" from a normal expired session; both look like a plain redirect to the login page.
- Enforced entirely on the backend (new `currentSessionId` stamped on the user row per login, compared against the JWT on every request) — nothing to build or maintain on the frontend for this.

#### Session recovery (Implemented — 2026-07-27)

**The bug this fixes.** Returning to the portal after a few days' gap produced repeated `401 /api/auth/me` and no way back in short of clearing cookies by hand. Being logged out after a gap is correct — the refresh token's idle window is one hour, and that is deliberate (see the backend documentation's Layer 4 "Session recovery" for why it stays at one hour). Being *unable to log back in* was not.

The backend half — an unauthenticated `POST /auth/logout`, and a 401 evicting the dead `access_token`/`csrf_token` when no refresh cookie remains — is documented on that side. The frontend half is `src/api/axios.ts`, which now draws three distinctions instead of treating every 401 identically. **Collapsing them back into one is what caused the bug**, so they're worth stating plainly:

| Case | Behaviour | Why |
|---|---|---|
| 401 on a normal request | One shared silent `POST /auth/refresh` (deduped across a burst via `refreshPromise`), then retry the original request | The 15-minute access token lapsing mid-session is routine; the user should never see it |
| 401 from `/auth/refresh` or `/auth/login` (`NON_SESSION_401_PATHS`) | Rejected as-is. Never triggers a refresh retry, never calls `onUnauthorized`, never redirects | Refresh tokens are single-use, so a tab that loses the rotation race 401s here *while the winner has already installed fresh cookies in the shared jar*. Redirecting on that logged every tab out over a race the retry recovers from. And a wrong password is not a dead session |
| 401 on the app-load probe (`getMe({ sessionProbe: true })` in `AuthContext`) | `onUnauthorized()` clears the user; **no** `window.location.assign` | A 401 here is the normal "not logged in" answer on any cold visit. Forcing a hard navigation reloaded the page mid-boot before the login form had rendered — which is what the user actually saw as "the error keeps coming back". `ProtectedRoute` navigates to `/login` reactively, which is enough |
| 401 after a refresh was already tried, on a non-probe request | `onUnauthorized()` **and** `window.location.assign('/login')` | Only a session that died *under* the user warrants a hard navigation — never leave someone staring at a broken authenticated page |

`sessionProbe` and `_retriedAfterRefresh` are declared via module augmentation on `AxiosRequestConfig` in `src/api/axios.ts`, so they're type-safe rather than casts. Regression tests live in `src/api/axios.test.ts` — they stub the transport (`api.defaults.adapter`) rather than the network, so the interceptor itself is what's under test.

### Layer 5 — Secrets Management (Implemented)

> IG credentials and all sensitive secrets are no longer stored in a plain `.env` file on disk.

| Secret | Storage |
|---|---|
| IG API key, username, password | AWS Secrets Manager |
| JWT signing secret | AWS Secrets Manager |
| Webhook secret | AWS Secrets Manager |
| Database password | AWS Secrets Manager |

How it works:
- At server boot, NestJS fetches secrets from AWS Secrets Manager over an encrypted TLS connection using the EC2 instance's IAM role
- Secrets are held in memory only — never written to disk
- The `.env` file on the server contains only non-sensitive config (PORT, NODE_ENV, AWS region, secret names)
- IAM role grants the EC2 instance read-only access to only the specific secrets it needs
- Secret rotation is possible without redeploying — the app re-fetches on a schedule
- Outbound email (OTP codes, invite/reset emails) goes through AWS SES, authorized via that same EC2 IAM role — no SES API keys exist to manage or rotate

### Layer 6 — Database & Backup Security

| Control | Detail |
|---|---|
| TypeORM parameterized queries | SQL injection prevention (automatic) |
| Sensitive data excluded from logs | API keys, passwords, tokens never logged |
| **S3 backup encryption** | **Server-side encryption (SSE-S3) enabled on bucket (IMPLEMENTED)** |
| **EBS snapshot encryption** | **Snapshots inherit volume encryption (IMPLEMENTED)** |
| S3 bucket access | Private, IAM-restricted, no public access |

### Layer 7 — Trading Safety

| Protection | Mechanism |
|---|---|
| Global kill switch | One portal toggle stops all trading |
| Daily total spend cap | Stops BUYs at daily GBP limit |
| Daily trade count cap | Stops after max trades/day |
| Consecutive failure auto-pause | Pauses bot after N failures |
| Existing-position resolution | Resolves the ticker's open position (either direction) before the throttles — decides open vs. skip vs. reverse |

### Honest Security Statement

No system is 100% secure. With points 1–5 implemented, this system now closes the most financially dangerous gaps for a private trading bot: stolen-password protection (2FA), credential-on-disk exposure (Secrets Manager), disk and backup encryption, and vulnerable dependencies. Remaining good-practice items for later: periodic webhook secret rotation (operational discipline) and professional penetration testing before trading large amounts.

---

## 6. User Management

A simple user management system so a portal user can create additional users without touching the database.

### Access model

There are no roles — every authenticated user has full access to everything (an earlier ADMIN/VIEWER split was removed; the backend dropped the `users.role` column). The first user is created during deployment via a seed script.

### User Management Endpoints

All endpoints require an authenticated session; there is no per-endpoint role distinction.

| Method | Path | Description |
|---|---|---|
| GET | /users | List all users |
| POST | /users | Create a new user (email, name, temp password) |
| PATCH | /users/:id | Update name or active status |
| POST | /users/:id/reset-password | Resend the pending temp password, or generate a new one if none is pending — see below |
| DELETE | /users/:id | Deactivate a user (soft delete) |
| GET | /users/me | Get own profile |
| PATCH | /users/me/password | Change own password |

### Create User Flow (Simple)

1. Go to Users page → click "Add User"
2. Enter: name, email
3. System generates a temporary password, shows it once, and emails the new user an invite (temp password + portal link)
4. New user logs in with the temp password
5. On first login, the user is forced to set a new password, then can optionally enable two-factor authentication
6. Done — minimal friction

### Reset/Resend Password Is Idempotent While Pending

`POST /users/:id/reset-password` doesn't always mint a new temp password — if one is already pending (the user hasn't set their own password yet), it resends that exact same one instead, so clicking it again (or an invite email that never arrived) doesn't keep invalidating whatever was already sent or shown. It only mints a genuinely new password when nothing is pending. The row action in the Users table reflects this: tooltip reads "Resend password" when a reset is pending, "Reset password" otherwise (`src/pages/users/Users.tsx`, keyed off `user.mustChangePassword`). The confirmation dialog always shows the current password as a fallback in case email delivery fails, with a "Copy" button — there's no separate "resend email" action anymore, since clicking the row action again does the same safe thing.

### Self-Service Forgot Password

A two-step, OTP-based flow — the same emailed-code mechanism as login 2FA and 2FA setup, just a third purpose (`RESET`):

1. `POST /auth/forgot-password` (`{ email }`) emails a 6-digit code. Always the same generic response, enumeration-safe.
2. `POST /auth/reset-password` (`{ email, code, newPassword }`) verifies the code and sets the new password in one call.

On the login page, "Forgot password?" opens three inline steps — `src/pages/login/Login.tsx`, `forgotStage: 'email' | 'code' | 'password'`:

- **email** — enter the account email, submit → calls step 1 above, always advances regardless of the (generic) response.
- **code** — the shared `OtpInput` component; typing all 6 digits calls `onComplete` and advances to the next stage immediately, client-side only — the code itself isn't actually checked against the backend until the final submit. Has a "Resend" link (re-calls step 1) and a "Back to login" link.
- **password** — new password + confirm fields; submit calls step 2 above with the email, the code captured from the previous stage, and the new password together. A wrong/expired code sends the user back to the code stage to re-enter it rather than losing the password they just typed.

On success, a toast confirms and the user is returned to the credentials step to sign in with the new password — there's no auto-login from this flow.

### User Table Behaviour

- Deleting a user is a soft delete (sets `active = false`) so trade history attribution is preserved
- A user cannot deactivate their own account (prevents lockout)
- At least one active user must always exist (enforced server-side)

---

## 7. Environment Variables & Secrets

### Non-Sensitive (.env file on server)

| Variable | Description | Example |
|---|---|---|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | production |
| AWS_REGION | AWS region | eu-west-2 |
| DB_HOST | Always localhost | 127.0.0.1 |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | trading_view_bot |
| FRONTEND_ORIGIN | Portal URL (CORS + emailed portal links) | https://portal.your-domain.com |
| PUBLIC_BASE_URL | Backend's own public URL — builds the webhook URL shown on Settings (`{PUBLIC_BASE_URL}/api/webhook/signal`) | https://api.your-domain.com |
| TRADINGVIEW_IPS | Comma-separated webhook source IPs the backend checks. Unset = fails closed, no signal ever gets through | 52.89.214.238,34.212.75.30,54.218.53.128,52.32.178.7 |
| EMAIL_FROM | Verified SES sender identity | no-reply@your-domain.com |
| SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD | Optional — only read by the backend's `pnpm seed`, only on its first run. Never commit real values | (local .env only) |
| SECRET_NAME_IG | Secrets Manager key name | prod/trading-bot/ig |
| SECRET_NAME_APP | Secrets Manager key name | prod/trading-bot/app |

### Sensitive (AWS Secrets Manager — never on disk)

| Secret | Stored In |
|---|---|
| IG_API_KEY, IG_USERNAME, IG_PASSWORD | prod/trading-bot/ig |
| DB_PASSWORD | prod/trading-bot/app |
| JWT_SECRET | prod/trading-bot/app |
| WEBHOOK_SECRET | prod/trading-bot/app |

---

## 8. Database Schema

### Tables

| Table | Purpose |
|---|---|
| users | Portal accounts with 2FA |
| token_blacklist | Invalidated JWTs (logout) |
| stock_mapping | Per-stock config — Epic, amount, conditions |
| trading_rules | Global trading conditions (single row) |
| trade_log | Every signal and its outcome |

### users

| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | Auto-generated |
| name | VARCHAR(255) | Display name |
| email | VARCHAR(255), Unique | Login email |
| password_hash | VARCHAR(255) | bcrypt cost 12 |
| active | BOOLEAN | Soft delete flag, default true |
| two_factor_enabled | BOOLEAN | Default false; user opts in after first login or via Settings |
| otp_code_hash | VARCHAR(64), Nullable | SHA-256 hash of the current email OTP |
| otp_expires_at | TIMESTAMP, Nullable | OTP expiry (10 min from send) |
| otp_purpose | VARCHAR(10), Nullable | LOGIN or SETUP |
| otp_attempts | INTEGER | Wrong-code counter; OTP invalidated after 5 |
| otp_last_sent_at | TIMESTAMP, Nullable | Drives the 30s resend cooldown |
| must_change_password | BOOLEAN | True for new users, forces reset on first login |
| failed_login_attempts | INTEGER | Brute force counter |
| locked_until | TIMESTAMP, Nullable | Set when locked |
| last_login_at | TIMESTAMP, Nullable | For audit |
| current_session_id | VARCHAR(36), Nullable | Refreshed on every full login — backs single-active-session enforcement (Section 5 Layer 4) |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

### token_blacklist

| Column | Type | Notes |
|---|---|---|
| id | SERIAL, PK | |
| token_hash | VARCHAR(255) | SHA-256 of invalidated token |
| expires_at | TIMESTAMP | For auto-cleanup |
| created_at | TIMESTAMP | |

### stock_mapping

| Column | Type | Notes |
|---|---|---|
| id | SERIAL, PK | |
| tv_ticker | VARCHAR(20), Unique | e.g. AAPL |
| ig_epic | VARCHAR(60) | e.g. CS.D.AAPL.CASH.IP |
| instrument_name | VARCHAR(255) | e.g. Apple Inc (All Sessions) |
| instrument_type | VARCHAR(50) | SHARES, COMMODITIES |
| enabled | BOOLEAN | Default true |
| investment_amount | DECIMAL(12,2), Nullable | GBP per trade. NULL = inherit trading_rules.investment_amount (the global default) |
| max_daily_spend | DECIMAL(12,2), Nullable | Per-stock daily cap |
| execution_mode | VARCHAR(20), Nullable | MARKET or SIGNAL_PRICE. NULL = inherit trading_rules.execution_mode |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### trading_rules (single row)

| Column | Type | Default | Description |
|---|---|---|---|
| id | INTEGER, PK | 1 | Always 1 |
| bot_enabled | BOOLEAN | true | Master kill switch |
| allow_buy | BOOLEAN | true | Global BUY toggle |
| allow_sell | BOOLEAN | true | Global SELL toggle |
| daily_max_total_investment | DECIMAL(12,2) | NULL | Daily GBP cap |
| daily_max_trade_count | INTEGER | NULL | Daily trade cap |
| investment_amount | DECIMAL(12,2) | 500 | Global default GBP per trade. A stock's own investment_amount overrides this when set |
| max_consecutive_failures | INTEGER | 3 | Auto-pause threshold |
| consecutive_failure_count | INTEGER | 0 | Running counter |
| execution_mode | VARCHAR(20) | MARKET | Global default fill mode — MARKET or SIGNAL_PRICE. See "Execution Mode" below |
| updated_at | TIMESTAMP | Auto | |
| updated_by | UUID | NULL | Audit |

### trade_log

| Column | Type | Notes |
|---|---|---|
| id | SERIAL, PK | |
| tv_ticker | VARCHAR(20) | |
| ig_epic | VARCHAR(60), Nullable | |
| direction | VARCHAR(4) | BUY or SELL |
| signal_price | DECIMAL(12,4) | From TradingView — used only to size the trade, not an execution price |
| executed_price | DECIMAL(12,4), Nullable | Actual IG fill price (`confirmDeal`'s `level`). Orders are MARKET not LIMIT, so this can differ from signal_price. Null unless status = SUCCESS |
| trade_value | DECIMAL(12,2), Nullable | Renamed from `investment_amount` 2026-07-15. The REAL £ notional actually committed (size × price-in-points) for a BUY that reached a computed size. Always NULL for SELL and for any BUY that never got that far |
| size | DECIMAL(12,4), Nullable | Renamed from `quantity` 2026-07-15. IG's `size` — a £-per-point stake for BUY, or the exact size of the position being closed for SELL. NOT a share count |
| deal_reference | VARCHAR(100), Nullable | IG temp ref |
| deal_id | VARCHAR(100), Nullable | IG permanent ID |
| status | VARCHAR(30) | See status list |
| skip_reason | VARCHAR(100), Nullable | Which condition skipped it |
| error_message | TEXT, Nullable | IG error if FAILED |
| signal_received_at | TIMESTAMP | |
| executed_at | TIMESTAMP, Nullable | |
| created_at | TIMESTAMP | |

### Trade Log Status Values

SUCCESS, FAILED, MARKET_CLOSED, NOT_MAPPED, DISABLED, NO_POSITION, BOT_PAUSED, BUY_DISABLED, SELL_DISABLED, ALREADY_LONG, ALREADY_SHORT, DAILY_TOTAL_LIMIT, DAILY_TRADE_LIMIT, GLOBAL_POSITION_LIMIT, STOCK_DAILY_LIMIT, COOL_DOWN, MAX_POSITIONS_STOCK, AUTO_PAUSED, DUPLICATE_SIGNAL

> 19 statuses total. `DUPLICATE_SIGNAL` is logged by the technical resend-guard described in Section 9 — it isn't one of the numbered business-rule steps, but every signal that reaches the pipeline still gets a `trade_log` row, so it's a real status value the frontend must render a badge for. `ALREADY_LONG`/`ALREADY_SHORT` were added 2026-07-16 with short selling — a BUY while already long, or a SELL while already short. `MARKET_CLOSED`, `GLOBAL_POSITION_LIMIT`, `COOL_DOWN`, and `MAX_POSITIONS_STOCK` are legacy-only: nothing writes them since the markets/trading-hours feature and the position-cap/cool-down throttles were removed. `NO_POSITION` is also legacy-only as of 2026-07-16 — a SELL with no position now opens a short instead of skipping. All legacy statuses' historical rows keep their badges.

> No `closing_price` / `profit_loss` / `profit_loss_pct` columns — P&L display was tried (computed from the TradingView signal price on the closing trade) and removed app-wide. See Section 19 Limitation 1.

---

## 9. Trading Conditions & Rules

### Condition Check Order

When a signal arrives, conditions are checked in sequence. The first failure stops processing.

> Ahead of step 1, a technical (non-business) duplicate-delivery guard runs: if the same ticker + direction + price arrived within the last 20 seconds, the signal is logged `DUPLICATE_SIGNAL` and skipped. This exists because TradingView can resend the same webhook on delivery retry — it's not one of the numbered steps below.

> There is no market-hours check — the markets/trading-hours feature was deliberately removed. Signals are processed whenever they arrive; an out-of-hours order goes to IG and is logged FAILED if IG rejects it. The global position cap, per-stock cool-down, and per-stock max-positions throttles were also deliberately removed — don't reintroduce them without discussing first.

```
1. bot_enabled = true?             → NO → BOT_PAUSED
2. direction allowed?              → NO → BUY_DISABLED / SELL_DISABLED
3. ticker in mapping? (case-insensitive since 2026-07-16) → NO → NOT_MAPPED
4. stock enabled?                  → NO → DISABLED
5. resolve existing position for this ticker (either direction — short selling, see below)
     same direction already open?  → NO → ALREADY_LONG / ALREADY_SHORT
     opposite direction open?      → this signal CLOSES it — skip straight to step 9, never throttled
     no position?                  → this signal OPENS one (BUY=long, SELL=short) — subject to steps 6-8
6. daily trade count OK? (opening only)      → NO → DAILY_TRADE_LIMIT
7. daily total investment OK? (opening only) → NO → DAILY_TOTAL_LIMIT
8. stock daily spend OK? (opening only)      → NO → STOCK_DAILY_LIMIT
9. calculate size, execute
10. log SUCCESS or FAILED
11. if FAILED: increment failure counter; auto-pause if threshold hit
```

### Short Selling (added 2026-07-16)

One position per ticker, at most — never hedged. A SELL with no open position now opens a short (previously skipped with `NO_POSITION`), symmetric with how a BUY opens a long. A same-direction signal while already in that direction is skipped (`ALREADY_LONG`/`ALREADY_SHORT`) instead of doubling exposure. An opposite-direction signal closes what's open, same as before, never throttled. Portal implication: the Trades page shows `ALREADY_LONG`/`ALREADY_SHORT` badges, and a SELL row with a `trade_value` now means "opened a short," not just "closed a long."

### Global Conditions (trading_rules)

Bot master switch, allow buy/sell toggles, daily max total investment, daily max trade count, consecutive failure auto-pause. Full descriptions as documented — each configurable from the Conditions page.

### Per-Stock Conditions (stock_mapping)

Investment amount, max daily spend per stock, and a per-stock trading on/off switch. The switch is live directly in the Stocks list rows and on the stock's detail page (`/stocks/:ticker` → "Trading conditions" card); the other fields are edited on the stock's edit screen.

### Investment Amount — Global Default vs. Per-Stock Override

**Sizing model corrected 2026-07-15 — IG's `size` is a £-per-point stake, NOT a share count** (proven live: a size-1 GOOG position moving 2 points paid exactly £2; a size-0.24 PayPal position moving 12.2 points cost £2.93). The old shares-based formula sent orders ~100x too large at realistic prices. Correct formula: `size = floor((investment_amount / price_in_points) × 100) / 100`, where `price_in_points` is the signal price scaled onto IG's own quote — never the raw signal price. If that floors to zero, or is positive but below IG's live minimum deal size for that instrument, the trade logs `FAILED` rather than placing an invalid or oversized order. Which investment amount is used follows the same override pattern as execution mode and slippage below: a stock's own `investmentAmount` (nullable) overrides `TradingRules.investmentAmount` (the global default, never null) when set.

**`trade_log.tradeValue` is the real computed £ notional (size × price_in_points), not the raw configured input** — it's null until a BUY successfully sizes past the minimum-deal-size check, and always null for SELL (closing a position is never a new investment). Don't confuse it with the "investment amount" config fields above, which only express intent.

**Where to set it:**
- **Global default** — Conditions page → "Investment" card ("Default investment per trade").
- **Per-stock override** — Add Stock / Edit Stock form → "Override investment per trade" switch. When off, the stock inherits the global default (shown in the helper text and, on the Stocks list and stock detail page, as a "(default)" tag next to the resolved amount); when on, it uses its own value regardless of the global setting.

### Execution Mode — Market Price vs. Signal Price

Controls the price a trade actually fills at (separate from sizing, which follows the formula above no matter what this is set to).

- **Market price** (default) — fills immediately at IG's current price. This was the only behaviour before this setting existed.
- **Signal price** — places a LIMIT order at the exact TradingView signal price. Only fills at that price or better; if the market has already moved past it, the trade doesn't fill.

**Where to set it:**
- **Global default** — Conditions page → "Execution" card. Applies to every stock unless overridden.
- **Per-stock override** — that stock's detail page (`/stocks/:ticker`) → "Trading conditions" card → "Override fill price for TICKER" switch. When off, the stock inherits the global default (shown in the helper text); when on, it uses its own choice regardless of the global setting.

Both use the same `ExecutionModeToggle` component (`src/components/common/ExecutionModeToggle.tsx`) — a two-option card-style segmented control with icons (⚡ Market, 🎯 Signal), not a plain switch, since it's a named-mode choice rather than a boolean.

**Important:** if a signal-price limit order can't fill immediately, it is logged `FAILED` exactly like a rejected market order — there is no pending/working-order state, no retry, no cancellation timer. This is a deliberate scope decision on the backend, not a placeholder for a future working-order feature.

### Dev Test Signal (Manual Bypass)

A flask icon next to each stock (Stocks list row actions, and the stock's own detail page next to "Edit") opens `SendTestSignalModal` (`src/pages/stocks/components/SendTestSignalModal.tsx`): pick Buy/Sell, enter a signal price, optionally enter an investment amount (blank = use the stock's configured amount), optionally override execution mode/slippage, submit. It calls `POST /signal/test` and shows the resulting trade status (`StatusPill`), size, trade value, and fill price right in the dialog — no need to go check the Trades page separately. A collapsible "Raw IG API exchange" panel shows the exact request/response bodies exchanged with IG for that signal (`igDebug` in the response — added 2026-07-15 after documentation and even IG's own support chatbot gave confidently wrong answers about size/points semantics; this lets any future question be settled directly rather than via a one-off diagnostic script). The investment-amount field only affects that one test call; it never writes to the stock's real config.

**Only rendered when `GET /system/status` returns `testSignalsEnabled: true`** (mirrors the backend's `ENABLE_TEST_SIGNALS` env var, off by default). This is not a sandbox — it runs the exact same condition pipeline as a real TradingView webhook and can place a real IG order if the conditions pass. Never assume it's safe just because it's hidden from the UI; the backend guard is what actually enforces this, the UI hide is just so nobody clicks it by accident.

---

## 10. Backend — NestJS

### Module Overview

| Module | Responsibility |
|---|---|
| AuthModule | Login, JWT, 2FA, brute force protection |
| UserModule | User CRUD, password reset |
| SecretsModule | Fetches secrets from AWS Secrets Manager at boot |
| IGClientModule | IG API session + all IG calls |
| WebhookModule | Receives signals with IP + secret validation |
| SignalModule | Condition pipeline orchestration + dev-only `POST /signal/test` manual bypass |
| TradingRulesModule | Global conditions CRUD |
| MappingModule | Stock mapping CRUD + IG market search |
| TradeModule | Trade execution + logging |
| StatsModule | Aggregated and per-stock statistics |
| SystemModule | Webhook URL, IG connection status, last-received-signal status |
| RealtimeModule | WebSocket gateway — pushes live updates to the portal |
| HealthModule | Unauthenticated `GET /health` — DB connectivity check for uptime monitoring / deploy verification |
| SchedulerModule | Token refresh + nightly backup cron |

### AuthModule

| Method | Path | Description |
|---|---|---|
| POST | /auth/login | Email + password → forced password change, email-OTP challenge, or a full session |
| POST | /auth/login/2fa | Email + password + emailed code → JWT cookie |
| POST | /auth/login/2fa/resend | Re-send the login OTP (30s cooldown) |
| POST | /auth/forgot-password | Self-service password reset, step 1: email an OTP (`otpPurpose: 'RESET'`). Always returns the same generic message, enumeration-safe. Throttled same as login. |
| POST | /auth/reset-password | Self-service password reset, step 2: `{ email, code, newPassword }` → verifies the code and sets the new password in one call. Same generic `401` for a wrong code or an unknown email. |
| POST | /auth/2fa/enable | Enable 2FA for the authenticated user — no OTP confirmation (product decision 2026-07-10) |
| POST | /auth/2fa/skip | Acknowledge skipping 2FA setup during onboarding |
| POST | /auth/2fa/disable | Disable 2FA — no password confirmation (product decision 2026-07-10) |
| POST | /auth/logout | Blacklist token, clear cookie |
| GET | /auth/me | Current user |

### UserModule

Endpoints as documented in Section 6.

### SecretsModule

Internal only. On boot, fetches all secrets from AWS Secrets Manager, holds in memory, exposes a typed `get(key)` method to other modules. Re-fetches on a schedule to support rotation.

### IGClientModule

Internal service. Methods: login, refreshSession, searchMarkets, getOpenPositions, getOpenPositionCount, placeOrder, confirmDeal, isSessionActive. (See Section 15 for the exact IG endpoints.)

### WebhookModule

| Method | Path | Guards |
|---|---|---|
| POST | /webhook/signal | TradingViewIPGuard → WebhookSecretGuard → ValidationPipe |

### StatsModule

| Method | Path | Description |
|---|---|---|
| GET | /stats/overview | Global dashboard stats |
| GET | /stats/daily-activity | Trade volume per day (chart) |
| GET | /stats/by-stock | Stats grouped by stock (chart) |
| GET | /stats/stock/:ticker | Detailed single-stock stats + chart data |
| GET | /stats/status-breakdown | Count of each trade status |

### SystemModule

| Method | Path | Description |
|---|---|---|
| GET | /system/status | `{ webhookUrl, igConnected, igSessionExpiresAt, lastSignalReceivedAt }` |

`lastSignalReceivedAt` is the timestamp of the most recent `trade_log` row (every webhook delivery writes one, whether it traded, was skipped, or was a duplicate) — it's the only reliable way to know TradingView is actually reaching the webhook, since TradingView never confirms delivery on its own. Shown on the Settings page as "Last TradingView signal".

### RealtimeModule

A Socket.IO gateway, authenticated the same way as the REST API (JWT read from the same HttpOnly cookie). Replaces what used to be fixed-interval polling. Broadcasts:

| Event | Payload | Triggers |
|---|---|---|
| `trade:created` | `TradeLog` | Every webhook delivery — trade, skip, or duplicate |
| `rules:updated` | `TradingRules` | Global conditions saved |
| `system:status` | `{ igConnected: boolean }` | IG session established/lost |
| `positions:updated` | raw IG position list | After a trade executes, and once on client connect |

The frontend mostly uses these events to trigger a TanStack Query refetch (`queryClient.invalidateQueries`) rather than consuming the payload directly, so payload shape drift between this and the equivalent REST endpoint is low-risk today — but don't rely on that if you add a new consumer that reads the payload directly.

---

## 11. Frontend — React

### Pages

| Page | Path | Description |
|---|---|---|
| Login | /login | Email + password + optional email-OTP 2FA |
| Dashboard | / | Global stats + charts |
| Stocks | /stocks | Per-stock config table |
| Stock Detail | /stocks/:ticker | Single-stock statistics + charts + per-stock trading conditions (trading on/off switch, investment amount, daily cap) |
| Open Positions | /positions | Currently open positions, live from IG, plus a "Close all positions" button (see below) |
| Trades | /trades | Full trade history with filters + CSV export |
| Conditions | /conditions | Global trading rules |
| Users | /users | User management |
| Settings | /settings | Webhook URL, IG connection status, last TradingView signal received, password, 2FA |

#### Close all positions (manual)

A destructive, confirm-gated button in the `/positions` header calling `POST /trades/close-all-positions` (`closeAllPositions` in `api/trades.ts`, `useCloseAllPositions` in `hooks/useTrades.ts`). It closes **every** position open on IG at market price — not just the rows matching the current search/direction/ticker filters — so the confirm dialog says so explicitly whenever the list is narrowed, and only quotes a count when it isn't.

The response is `{ attempted, closed, failures[] }`; a partial result is a normal outcome, not an error. On a partial result the toast names each instrument still open and runs its raw IG code through `explainTradeError` — "closed 3 of 5" on its own would leave the user with live exposure and no idea which. The button hides when there is nothing to close and disables while the request is in flight (the backend also rejects a concurrent second call with `409`).

### Stack

React + TypeScript + Vite, TailwindCSS, shadcn/ui, Recharts, TanStack Query, Socket.IO client, Axios with interceptors (JWT cookie auto-sent, `X-CSRF-Token` attached to mutations, 401 → silent refresh then redirect to login — see Section 5 Layer 4 "Session recovery" for which 401s redirect and which don't).

---

## 12. Dashboard & Statistics

### Global Dashboard (/)

**Stat cards:**
- Bot status (ON/OFF with one-click toggle)
- Total trades (lifetime)
- Today's trades
- Today's invested (£)
- Daily limit remaining (progress bar)
- Open positions (live from IG)
- Success rate (% of SUCCESS vs total)
- Consecutive failures (warning if > 0)

**Charts:**
- Trade volume over time (line chart, last 30 days)
- BUY vs SELL split (donut chart)
- Trade status breakdown (bar chart — SUCCESS, FAILED, skipped reasons)
- Top stocks by trade count (horizontal bar chart)
- Daily invested amount (area chart, last 30 days)

**Alerts panel:**
- Red banner if bot AUTO_PAUSED
- Yellow banner if consecutive failures > 0
- Yellow banner if approaching daily limits

### Per-Stock Statistics (/stocks/:ticker)

Every individual stock has its own detailed statistics page with charts:

**Stat cards (per stock):**
- Total trades for this stock
- Total invested (£)
- BUY count / SELL count
- Success rate
- Last traded date
- Currently open? (yes/no from IG)

**Charts (per stock):**
- Trade history timeline (line chart of this stock's trades over time)
- Signal price at each trade (line chart showing entry prices)
- BUY vs SELL for this stock (donut)
- Status breakdown for this stock (bar chart)
- Investment amount over time (bar chart)

**Table:**
- This stock's complete trade history with all columns

> This directly answers the requirement: "all statistics of single single stock should also be there in chart form." Each stock is fully drillable from the Stocks page → click a stock → see its dedicated stats dashboard.

### Statistics Data Source

All statistics are computed from the `trade_log` table by the StatsModule. No external analytics service. Aggregations (counts, sums, success rates) run as SQL queries grouped by ticker, status, direction, and date.

---

## 13. UI / UX Design Direction

> Requirement: modern, cool, 2026 futuristic aesthetic but simple UX.

### Design Principles

| Principle | Application |
|---|---|
| Futuristic but calm | Dark-first theme with subtle accent gradients, not noisy |
| Glassmorphism touches | Frosted card surfaces over a deep background, used sparingly |
| Data-forward | Charts and numbers are the hero; chrome stays minimal |
| Simple UX | One primary action per screen; no nested menus; max 2 clicks to anything |
| Responsive | Works on desktop and tablet; Vipul may check on mobile |
| Accessible | shadcn/ui primitives, keyboard navigable, proper contrast |

### Visual Language

- **Theme:** Dark mode default with a light mode toggle. Deep slate/near-black background (#0A0E1A range) with elevated card surfaces.
- **Accent:** A single electric accent — **indigo-blue** (`#5666f5` dark / `#3548f3` light), which replaced the earlier teal-cyan/violet direction — used for primary actions, active states, and chart highlights. Not rainbow. Only the `--stat-*` palette is multi-hued, and only to distinguish stat cards and chart series.
- **Typography:** Clean geometric sans (Inter or Geist). Large readable numbers for stats. Two weights only.
- **Cards:** Subtle border, soft inner elevation, slight frosted/translucent surface. Rounded corners (12–16px).
- **Charts:** Smooth, animated-in-on-load Recharts with the accent color. Gridlines muted. Tooltips on hover.
- **Motion:** Subtle. Fade/slide-in on page load, smooth number count-ups on stat cards, gentle hover states. No gratuitous animation.
- **Status colors:** Green (success), red (failed), amber (warning/skipped), muted gray (neutral skips).

### UX Rules

- Bot ON/OFF toggle is always visible in the top bar — the most important control, one click from anywhere
- Every destructive action (delete user, disable stock) has a confirm dialog
- Forms validate inline with clear error messages
- Loading states use skeletons, not spinners, for a smoother feel
- Empty states have helpful guidance (e.g. "No stocks yet — add your first stock")
- The Stocks table → click any row → drills into that stock's stats page

### Top bar (implemented)

The top bar deliberately does **not** repeat the page title a third time (sidebar nav already highlights it, the page has its own `<h1>`). Instead, left-to-right: a time-of-day greeting with a matching icon (sunrise → sun → sunset → moon) and the signed-in user's name, today's date (plus the current ticker crumb on the stock detail page), then a live socket-connection indicator ("Live"/"Offline" pill), the bot ON/OFF toggle, theme toggle, and user menu. No clock — it was removed as redundant chrome.

### Sidebar collapse toggle (implemented)

Lives next to the logo/brand text at the top of the sidebar (not a separate row at the bottom) — a small icon-only button using the shared `Button` component (`variant="ghost" size="icon"`), with `PanelLeftClose`/`PanelLeftOpen` icons and a tooltip. Collapsed state stacks it directly under the logo. Keeping it in the header avoids a large dead-space gap below the last nav item on pages with few nav items.

> The frontend-design guidance and component tokens are detailed in the frontend repo's `.claude/skills` and design rules so the implementation stays consistent.

---

## 14. TradingView Configuration

### Step 1 — Enable 2FA
Profile → Security → Enable Authenticator App 2FA.

### Step 2 — Alert Message (JSON)

BUY alert:
```
{
  "secret": "WEBHOOK_SECRET_VALUE",
  "ticker": "{{ticker}}",
  "action": "BUY",
  "price": "{{close}}"
}
```

SELL alert:
```
{
  "secret": "WEBHOOK_SECRET_VALUE",
  "ticker": "{{ticker}}",
  "action": "SELL",
  "price": "{{close}}"
}
```

### Step 3 — Webhook URL
Notifications tab → Webhook URL → `https://your-domain.com/api/webhook/signal` on both alerts. Don't hand-type this — copy it from the portal's **Settings** page (System status → Webhook URL → copy icon), which reads it straight from the server's own `PUBLIC_BASE_URL`, so it's guaranteed to match what the server actually expects.

### TradingView Requirements

Premium/Pro+ plan, 2FA enabled, ports 80/443 only, HTTPS, respond within 3 seconds, no IPv6, 2 alert limit on Premium.

---

## 15. IG API Reference — Endpoints To Implement

> This is the definitive list of IG REST API endpoints Yash must implement. All are on the REST API (the Streaming API is NOT needed for v1).

### Base URLs

| Environment | URL |
|---|---|
| Demo | https://demo-api.ig.com/gateway/deal |
| Live | https://api.ig.com/gateway/deal |

### Required Headers (authenticated requests)

X-IG-API-KEY, CST, X-SECURITY-TOKEN, Content-Type: application/json, Accept: application/json; charset=UTF-8, Version (per endpoint).

### Endpoints To Implement

| # | Purpose | Method | Path | Version | When Used |
|---|---|---|---|---|---|
| 1 | Login / create session | POST | /session | 2 | At boot + token refresh |
| 2 | Search markets | GET | /markets?searchTerm={term} | 1 | When mapping a stock (find Epic) |
| 3 | Get market details | GET | /markets/{epic} | 3 | Optional — verify instrument details |
| 4 | Place position | POST | /positions/otc | 2 | Every BUY / SELL execution |
| 5 | Confirm deal | GET | /confirms/{dealReference} | 1 | After every order placement |
| 6 | Get open positions | GET | /positions | 2 | SELL check, global + per-stock position limits |
| 7 | Close position | DELETE | /positions/otc | 1 | When SELL closes an existing position |
| 8 | Get accounts | GET | /accounts | 1 | Optional — show account balance in portal |
| 9 | Logout / delete session | DELETE | /session | 1 | Clean shutdown (optional) |

### Endpoint Details

**1. Create Session (POST /session, v2)**
Body: identifier (username), password. Returns CST and X-SECURITY-TOKEN in response headers. These expire — refresh every 4 hours.

**2. Search Markets (GET /markets?searchTerm=, v1)**
Returns array of markets, each with: epic, instrumentName, instrumentType, marketStatus, bid, offer. Can return multiple results — user selects correct one in the portal.

**4. Place Position (POST /positions/otc, v2)**
Body: epic, direction (BUY/SELL), size (a £-per-point stake, NOT a share count), orderType (MARKET by default, or LIMIT — see "Execution Mode" above), `level` (signal price scaled onto IG's points, only when orderType is LIMIT), currencyCode (GBP — required on this endpoint regardless of account type), forceOpen (true), guaranteedStop (false), expiry (`'DFB'` — this is a spread-bet account, Section 1; `'-'` is CFD-only and gets rejected). Returns dealReference.

**5. Confirm Deal (GET /confirms/{dealReference}, v1)**
Returns dealId, dealStatus (ACCEPTED/REJECTED), status (OPEN/CLOSED), and `level` — the actual fill price, stored as `trade_log.executed_price` and shown in the Trades table. Always call after placing.

**6. Get Open Positions (GET /positions, v2)**
Returns array of positions with position.dealId, position.size, position.direction, market.epic, market.instrumentName. Used for all position checks.

**7. Close Position (DELETE /positions/otc, v1)**
Body: dealId, direction (opposite of open), size, orderType (MARKET by default, or LIMIT — same Execution Mode setting), `level` (only when LIMIT), expiry (`'DFB'`). Used when a SELL signal closes an existing long position.

### IG Epic Code Structure

Epic prefixes vary by account type and market — not hardcoded or parsed anywhere in the app, so this table is illustrative only.

| Segment | Example | Meaning |
|---|---|---|
| 1 | CS / UB / etc. | Product type code — varies by account type (CFD vs spread bet) and market |
| 2 | D | Daily funded (rolling) |
| 3 | AAPL | Underlying asset |
| 4 | CASH / DAILY | Spot/cash or daily-funded variant |
| 5 | IP | IG platform code |

### IG Rate Limits

40 trade requests per minute. More than sufficient for daily signals across 70 stocks.

### Confirmed Constraint

No price data is available for shares on the IG API. Quantity is calculated from the TradingView signal price, not IG. Live P&L must be viewed on the IG platform directly.

---

## 16. AWS Infrastructure

### EC2 Instance

| Setting | Value |
|---|---|
| Instance type | t3.small (2 vCPU, 2GB RAM) |
| OS | Ubuntu 26.04 LTS |
| EBS volume | 20GB, **encryption enabled** |
| Elastic IP | Yes — fixed webhook URL |
| IAM role | Read access to Secrets Manager + write to S3 backup bucket |
| Inbound 443 | From anywhere |
| Inbound 80 | From anywhere (Certbot) |
| Inbound 22 | Yash + Smit IPs only |

### Frontend Hosting (choose one, both free)

| Option | Cost | Notes |
|---|---|---|
| Nginx on same EC2 | £0 | Simplest, serves React build alongside API |
| Cloudflare Pages | £0 | Commercial use allowed, global CDN |

> Vercel Hobby is NOT used — it is non-commercial only and this is a paid client project.

### PostgreSQL

PostgreSQL 18 (Ubuntu 26.04 LTS default package). Self-hosted on the EC2 instance (not RDS — cost saving). Bound to localhost only. Protected by the backup strategy in Section 17.

### Secrets Manager

Two secrets: prod/trading-bot/ig and prod/trading-bot/app. EC2 IAM role grants read-only access.

### S3 Backup Bucket

| Setting | Value |
|---|---|
| Encryption | SSE-S3 enabled |
| Public access | Fully blocked |
| Lifecycle | Delete dumps older than 30 days |
| Access | EC2 IAM role only |

### Estimated Monthly Cost

| Resource | Cost |
|---|---|
| EC2 t3.small | ~$17 |
| EBS 20GB (encrypted) | ~$1.76 |
| Elastic IP | ~$3.60 |
| S3 backups | < $0.50 |
| EBS snapshots | ~$0.50–1 |
| Secrets Manager (2 secrets) | ~$0.80 |
| Data transfer | $0 (under 100GB free) |
| Frontend (Nginx on EC2 or Cloudflare Pages) | $0 |
| **Total** | **~$24/month (~£19)** |

> Self-hosting PostgreSQL on EC2 saves the ~$18/month RDS cost. The backup strategy (Section 17) mitigates the risk.

---

## 17. Backup & Disaster Recovery

> Two independent layers of protection for the self-hosted PostgreSQL database.

### Layer 1 — Nightly S3 Database Dumps

- A cron job runs at 02:00 UTC daily
- Runs a PostgreSQL dump, compresses it, uploads to the encrypted S3 bucket
- S3 lifecycle rule deletes dumps older than 30 days automatically
- Restore: download latest dump, run restore command (~2 minutes)
- Cost: negligible (< $0.01/month for these small files)

### Layer 2 — Daily EBS Snapshots

- AWS Data Lifecycle Manager takes a daily snapshot of the EC2 disk
- Snapshots are incremental (only changes stored) and inherit EBS encryption
- Retain 7 daily snapshots
- Restore: create a new volume from the latest snapshot
- Cost: ~$0.50–1/month

### Recovery Scenarios

| Scenario | Impact | Recovery |
|---|---|---|
| Deploy restart (`pm2 restart`, SIGTERM) | No signal loss — the backend delays shutdown up to 15s for any in-flight signal to finish before exiting | Deploy pipeline's post-restart `/health` check confirms it came back up |
| Hard crash (unhandled exception, OOM, SIGKILL) | Whatever signal was mid-execution at that instant is lost, not logged | PM2 auto-restarts; no data loss for anything already written |
| Disk failure | Up to 24h of trade logs lost | Restore from S3 dump or EBS snapshot |
| Instance terminated | Up to 24h lost | Restore from snapshot, re-attach Elastic IP |

> The stock mapping table (hardest to rebuild — 70 Epic lookups) is protected by both layers. Worst case loss is one day of trade logs.

### Missed Signals Note

If the server is down when a signal fires, TradingView's webhook fails and that signal is lost permanently — no trade, no log. For a daily strategy this is manageable but the team should be aware. A future enhancement could have TradingView also send to a backup queue.

---

## 18. Deployment Checklist

### Phase 1 — AWS Setup (Smit)
- [ ] Launch EC2 t3.small, Ubuntu 26.04 LTS, **EBS encryption enabled**
- [ ] Assign Elastic IP
- [ ] Security groups (443/80 open, 22 restricted)
- [ ] Create Secrets Manager secrets (IG creds, app secrets)
- [ ] Create encrypted S3 bucket with 30-day lifecycle
- [ ] Attach IAM role to EC2 (Secrets read, S3 write)
- [ ] Configure Data Lifecycle Manager for daily EBS snapshots
- [ ] Point domain to Elastic IP

### Phase 2 — Server Setup (Yash)
- [ ] Install Node.js 24 LTS, PM2, Nginx, Certbot, PostgreSQL 18, Fail2ban
- [ ] Harden SSH (key-only, disable passwords)
- [ ] Clone repo, install deps, `pnpm audit`
- [ ] Create non-sensitive .env
- [ ] Run all pending migrations (`pnpm migration:run`)
- [ ] Run seed script (first admin user + trading_rules row)
- [ ] Build NestJS, start with PM2
- [ ] Nginx reverse proxy + serve frontend build
- [ ] Certbot SSL
- [ ] Set up nightly S3 backup cron
- [ ] Verify HTTPS returns 200 on `GET /health` (unauthenticated — checks DB connectivity, safe to point uptime monitoring at)

### Phase 2b — CI/CD (Yash)

Phase 2 above is a one-time manual bootstrap. After that, both repos deploy automatically via GitHub Actions on every push to `main` (`.github/workflows/ci.yml` in each repo) — lint, build, test, and `pnpm audit --audit-level=high` must all pass before the deploy job runs; a red CI run never reaches production. The frontend deploy job runs this repo's own `.claude/scripts/deploy.sh` on the server.

- [ ] Generate a dedicated deploy SSH keypair; add the **public** key to the deploy user's `~/.ssh/authorized_keys` on the EC2 instance
- [ ] In both GitHub repos, add these **Actions secrets**: `EC2_HOST`, `EC2_SSH_USER`, `EC2_SSH_KEY` (the private key)
- [ ] In both GitHub repos, add the **Actions variable** `DEPLOY_PATH` (where each repo is cloned on the server, e.g. `/opt/trading-view-bot-backend` and `/opt/trading-view-bot-frontend`)
- [ ] Confirm the deploy user can run `sudo cp`/`sudo systemctl reload nginx` (the Nginx deploy target) without a password prompt — or switch the workflow's `TARGET` to `cloudflare` and add `CLOUDFLARE_API_TOKEN` instead
- [ ] Push to `main` once and confirm both the CI job and the deploy job go green in the Actions tab — the backend deploy job now curls `GET /health` after restart and fails the deploy if it doesn't come back healthy within ~15s

### Phase 3 — TradingView (Vipul)
- [ ] Enable 2FA, change both alerts to JSON, set webhook URLs

### Phase 4 — Configuration (Vipul via portal)
- [ ] First login → set password → set up 2FA
- [ ] Add all stocks (search → select Epic → set amount + conditions)
- [ ] Set global trading rules
- [ ] Set conservative daily limits for demo

### Phase 5 — Demo Testing
- [ ] Verify webhook arrives, trade executes on IG demo, appears in stats
- [ ] Test each condition (BOT_PAUSED, daily limits)
- [ ] Test 2FA login, user creation, per-stock stats page

### Phase 6 — Go Live
- [ ] Switch IG base URL to live
- [ ] Conservative amounts + low daily cap first week
- [ ] Monitor closely

---

## 19. Known Limitations & Not Doable Items

| # | Limitation | Detail |
|---|---|---|
| 1 | No P&L shown in the portal, at all | IG API has no share price data for shares. A "realized P&L" was briefly computed from TradingView signal prices on close, but the numbers weren't authoritative (not IG's actual fill price) so it was removed app-wide. View real P&L on the IG platform directly |
| 2 | API key needs live account | Cannot create from standalone demo |
| 3 | SELL could short without position check | Mitigated by mandatory position check |
| 4 | IG minimum deal size | Low amounts may be rejected; raise investment amount |
| 5 | TradingView 2-alert limit | Premium allows 2; upgrade for more indicators |
| 6 | Demo environment instability | Lower/variable rate limits on demo |
| 7 | US public holidays not handled | Bot attempts, IG rejects, logged FAILED |
| 8 | No stop-loss in v1 | Manual on IG platform |
| 9 | Signal price vs live drift | Negligible for daily signals |
| 10 | Single IG account | Multi-account needs redesign |
| 11 | Missed signals if server down | TradingView webhook fails silently; signal lost |

---

*Last updated: July 2026*
*Architecture: Smit Patel | Implementation: Yash Modi | Client: Vipul Patel*
