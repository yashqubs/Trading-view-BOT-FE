---
description: Scaffold a new portal page following design rules and conventions
---

Create a new page named `$ARGUMENTS` for the admin portal, following `.claude/rules.md` (design tokens) and `CLAUDE.md` (conventions).

Generate:
1. `src/pages/$ARGUMENTS/$ARGUMENTS.tsx` — the page component
2. Any page-specific components in `src/pages/$ARGUMENTS/components/`
3. A typed API hook in `src/api/` (or a TanStack Query hook) if the page fetches data
4. Add the route to the router

Requirements:
- Use theme tokens (CSS variables), never hardcoded colors — works in dark and light.
- Loading state uses skeletons, not spinners.
- Empty state has helpful guidance text.
- If the page has admin-only actions, gate them by role (VIEWER cannot see them).
- Destructive actions get a confirm dialog.
- Numbers rounded appropriately (money 2dp, % 1dp, counts integer).
- Subtle fade/slide-in on mount.
- Charts (if any) use Recharts with the accent color and muted gridlines.

After generating, run `pnpm build` and `pnpm lint`.
