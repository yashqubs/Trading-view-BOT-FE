---
description: Review the UI for design-system and UX consistency
---

Review the frontend (or the files I point you at) against the design rules in `.claude/rules.md`. Report any inconsistencies and offer fixes.

Check:

1. **Colors** — no hardcoded hex anywhere; everything uses theme CSS variables. Works in both dark and light mode (mentally test: would text be readable on the opposite background?).

2. **Typography** — Inter/Geist, only 400 and 500 weights (no 600/700). Sentence case everywhere, no ALL CAPS or Title Case. Stat numbers large and tabular.

3. **Components** — cards use --surface + 0.5px border + 14px radius. Buttons follow the primary/secondary/destructive pattern. Status pills use colored text in the same family, never black.

4. **Numbers** — every displayed number is rounded (money 2dp, % 1dp, counts integer). No floating-point artifacts.

5. **UX** — one primary action per screen; destructive actions confirm; loading uses skeletons; empty states have guidance; the bot ON/OFF toggle is present in the top bar.

6. **Role gating** — admin-only actions hidden from VIEWER.

7. **Accessibility** — focus rings visible, charts have aria labels, contrast is sufficient.

8. **Motion** — subtle only; no gratuitous animation.

Give a clear list of issues found with the file/line and the fix. If it's all consistent, say so.
