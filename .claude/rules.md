# Design Rules — Frontend

Concrete design tokens and component rules for the 2026-futuristic, simple-UX portal. Keep it consistent.

## Theme tokens (CSS variables)

**`src/index.css` is the source of truth for exact values** — read it there rather than trusting a hex quoted in prose, and never hardcode a colour in a component. The roles below are what matters:

| Token | Role |
|---|---|
| `--bg` | Page background — deep near-black in dark, near-white in light |
| `--surface` / `--surface-2` | Elevated card, and a secondary surface for tooltips/inputs |
| `--border` | Hairline separators |
| `--text-primary` / `--text-secondary` / `--text-tertiary` | Headings and numbers / labels and body / muted axis text |
| `--accent` / `--accent-soft` / `--accent-foreground` | **Indigo-blue** — the single accent, its low-alpha glow form, and the text colour that sits on top of it |
| `--success` / `--danger` / `--warning` / `--neutral` | Status semantics, used by badges, pills, and trend indicators |
| `--shadow-card` / `--shadow-floating` / `--shadow-sm` | The only three elevations. Don't invent a fourth |
| `--stat-violet`…`--stat-rose` | A 7-colour palette for per-card stat icons and multi-series charts |

**One accent, not a rainbow.** The accent is indigo-blue (`#5666f5` dark, `#3548f3` light) — this replaced the earlier teal-cyan/violet direction. Only the `--stat-*` palette is allowed to be multi-hued, and only for distinguishing stat cards and chart series.

### The `-rgb` channel triplets

Every colour also has an `--x-rgb` channel form (`--accent-rgb: 86 102 245`). Tailwind can't derive channels from a `var()` that resolves to a hex string, so opacity modifiers like `border-danger/30` or `bg-warning/10` only work through the triplet. **If you add or change a colour token, update its `-rgb` twin in the same edit** — they silently drift otherwise, and the failure looks like an opacity modifier just not applying.

## Typography

- Font: Inter (loaded at 400/500/600). **400 and 500 do almost all the work** — `font-medium` is the heaviest weight you should reach for by default, including for page `<h1>`s. `font-semibold` (600) exists and is used in ~14 deliberate spots (stat values, OTP digits, active nav); treat it as emphasis, not as a heading default. Never 700+ — `font-bold` appears nowhere and shouldn't start.
- Stat numbers: large (28–36px), medium weight, tabular-nums.
- Body: 14–16px, line-height 1.6.
- Sentence case everywhere. Never ALL CAPS, never Title Case.

## Components

### Cards
- `--surface` background, 0.5px `--border`, radius 14px.
- Subtle frosted feel: slight backdrop-blur where it overlaps content, very light.
- Generous padding (20–24px). No heavy shadows — at most a soft, low-opacity elevation.

### Stat cards
- Muted label on top (13px, `--text-secondary`), big number below (28px+, `--text-primary`).
- Optional trend indicator (small up/down with success/danger color).
- Number counts up smoothly on mount.

### Buttons
- Primary: `--accent` fill, dark text, subtle hover lift.
- Secondary: transparent, `--border`, `--text-primary`.
- Destructive: `--danger` outline, fill on confirm.
- Active scale(0.98) on press.

### Charts (Recharts)
- Line/area: accent color stroke, soft accent-gradient fill for areas.
- Muted gridlines (`--border`). Axis labels in `--text-tertiary`.
- Tooltips: `--surface-2` background, rounded, on hover.
- Animate-in on load (default Recharts animation is fine, keep it quick).
- Donut for splits (BUY/SELL), bar for status breakdown, line/area for time series.
- Never rely on color alone — pair with labels/legend.

### Tables
- Subtle row separators (`--border`), hover row highlight.
- Status cells use colored pills (success/danger/warning/neutral) with text in the same color family (darker shade), never plain black.
- Clickable rows (e.g. stocks → stock detail) show a pointer and hover state.

### Toggles / switches
- The bot ON/OFF master switch is prominent in the top bar — accent when ON, muted when OFF, with a clear label.

### Destructive actions
- Every destructive action goes through `ConfirmDialog` — deleting a user or stock, disabling a stock, closing positions. No exceptions, no "are you sure?" via `window.confirm`.
- **The dialog description states what will actually happen, in the user's terms**, not what the endpoint is called. For anything touching real money, say so explicitly: "Real orders are placed immediately and this cannot be undone."
- **Never let the confirm copy imply a narrower scope than the action has.** "Close all positions" on `/positions` closes everything on IG, not the filtered rows, so the dialog says so whenever a filter is narrowing the table and only quotes a count when it isn't.
- **Partial success is a real outcome, not an error.** When an action can half-succeed, the result toast names each item that failed and why (run raw backend codes through `explainTradeError`). A bare "3 of 5 succeeded" leaves the user unable to act on the other two.

## Motion

- Page load: content fades + slides up slightly (150–250ms).
- Stat numbers: count-up animation.
- Hover: gentle background/border transition (150ms).
- No bouncing, no parallax, no constant motion. Calm.

## Layout

- Sidebar nav (collapsible via a small icon button next to the logo/brand text — not a separate footer row, which leaves an awkward dead-space gap below the last nav item) + top bar with a time-of-day greeting + date (+ ticker crumb on stock detail), a live socket-connection pill, the bot toggle, theme switch, and user menu. The top bar deliberately does not repeat the page title — the sidebar and page `<h1>` already show it.
- Dashboard: responsive grid of stat cards, then charts.
- Max content width on large screens; comfortable spacing.
- Works down to tablet width; usable on mobile for quick checks.

## Accessibility

- shadcn/ui primitives (accessible by default).
- Keyboard navigable. Focus rings visible (accent).
- Contrast meets WCAG AA in both themes.
- Charts have aria labels and text fallbacks.

## The per-stock detail page (important)

`/stocks/:ticker` must feel like a mini dashboard for that one stock:
- A "Trading conditions" card near the top — a live trading on/off switch, investment per trade, and max daily spend for this ticker specifically. This is the same data as the Stocks list's edit screen, just scoped and always-visible here so you don't have to leave the stock you're looking at to change how it trades.
- Row of stat cards (total trades, invested, buy/sell counts, success rate, last traded).
- Charts: trade timeline (line), entry prices (line), buy/sell split (donut), status breakdown (bar), invested over time (bar).
- Full trade history table for that stock below the charts.
