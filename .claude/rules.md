# Design Rules — Frontend

Concrete design tokens and component rules for the 2026-futuristic, simple-UX portal. Keep it consistent.

## Theme tokens (CSS variables)

Define these in `src/index.css` and reference them everywhere — never hardcode hex.

### Dark (default)
- `--bg`: deep near-black, e.g. `#0A0E1A`
- `--surface`: elevated card, e.g. `#121826` with subtle translucency
- `--surface-2`: secondary surface, e.g. `#1A2236`
- `--border`: `rgba(255,255,255,0.08)`
- `--text-primary`: `#E8ECF4`
- `--text-secondary`: `#9AA4B8`
- `--text-tertiary`: `#5F6B85`
- `--accent`: electric teal-cyan `#22D3EE` (or violet `#8B5CF6` — pick one, stay consistent)
- `--accent-soft`: accent at low alpha for glows/highlights
- `--success`: `#34D399`
- `--danger`: `#F87171`
- `--warning`: `#FBBF24`

### Light
- `--bg`: `#F5F7FB`
- `--surface`: `#FFFFFF`
- `--border`: `rgba(0,0,0,0.08)`
- `--text-primary`: `#0F172A`
- accent/success/danger/warning: same hues, adjusted for contrast

## Typography

- Font: Inter or Geist. Two weights: 400 regular, 500 medium. Never 600/700.
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

## Motion

- Page load: content fades + slides up slightly (150–250ms).
- Stat numbers: count-up animation.
- Hover: gentle background/border transition (150ms).
- No bouncing, no parallax, no constant motion. Calm.

## Layout

- Sidebar nav (collapsible) + top bar with the bot toggle, theme switch, user menu.
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
- Row of stat cards (total trades, invested, buy/sell counts, success rate, last traded).
- Charts: trade timeline (line), entry prices (line), buy/sell split (donut), status breakdown (bar), invested over time (bar).
- Full trade history table for that stock below the charts.
