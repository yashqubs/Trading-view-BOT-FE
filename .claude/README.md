# Frontend `.claude` Setup

This folder configures Claude Code for the trading bot admin portal (React + Vite). It encodes the design system, UX rules, and conventions so the UI stays consistent and modern.

## Files

```
CLAUDE.md                  Root context + documentation reference
.claude/
├── PROJECT_DOCUMENTATION.md   Full project documentation (source of truth)
├── settings.json          Permissions (allow/deny) for Claude Code
├── rules.md               Design tokens, component rules, UX rules
├── commands/
│   ├── new-page.md        /new-page — scaffold a portal page
│   └── design-review.md   /design-review — check UI consistency
└── scripts/
    └── deploy.sh          Build + deploy to Nginx or Cloudflare Pages (no Vercel)

.github/
├── workflows/ci.yml       Live CI/CD — lint/build/test/audit on every push+PR,
│                           then runs deploy.sh over SSH on push to main
└── dependabot.yml         Weekly dependency update PRs
```

## How to use

1. Place `CLAUDE.md` and the `.claude/` folder at the repo root.
2. Make the deploy script executable: `chmod +x .claude/scripts/deploy.sh`.
3. Edit placeholders in `deploy.sh` (Nginx root path, Cloudflare project name).
4. To deploy by hand: `./.claude/scripts/deploy.sh nginx` or `./.claude/scripts/deploy.sh cloudflare`. In normal operation this runs automatically instead — see below.
5. For the automated deploy in `.github/workflows/ci.yml` to work, add repo secrets `EC2_HOST`, `EC2_SSH_USER`, `EC2_SSH_KEY` and repo variable `DEPLOY_PATH` under GitHub → Settings → Secrets and variables → Actions. See Section 18 Phase 2b of `PROJECT_DOCUMENTATION.md`.

## Slash commands

- `/new-page <name>` — scaffolds a page with theme tokens, skeletons, charts
- `/design-review` — audits UI against the design system

## Design direction encoded here

- 2026 futuristic, dark-first, single accent color, glassmorphism (sparingly)
- Data-forward: charts + big numbers are the hero
- Simple UX: one primary action per screen, max 2 clicks, bot toggle always visible
- Per-stock detail page is a mini-dashboard with its own charts (required)
- Auth via HttpOnly cookie (never localStorage)
- Theme tokens only, never hardcoded colors
- Accessible (shadcn/ui), subtle motion only

## Hosting note

Do NOT use Vercel — its free Hobby plan is non-commercial only and this is a paid client project. Deploy to Nginx on the EC2 instance (free) or Cloudflare Pages (free, commercial use allowed).
