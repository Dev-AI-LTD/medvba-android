# Branch protection — main (2026-07-30)

- Repo: `Dev-AI-LTD/medvba-android`
- Branch: `main`
- Applied: **YES** (GitHub API `PUT .../branches/main/protection`)
- Green CI reference: run `30543627943` / commit `ae8de57` — check name `lint-and-test`

## Rules applied

| Rule | Value |
|------|--------|
| Require status checks to pass | **YES** |
| Required check | `lint-and-test` (GitHub Actions app_id 15368) |
| Require branch up to date before merging (`strict`) | **YES** |
| Require pull request before merging | **NO** (direct-to-main allowed; status checks still required for merges when checks apply) |
| Enforce admins | **NO** |
| Allow force pushes | **NO** |
| Allow deletions | **NO** |

## Railway (this turn)

| Check | Result |
|-------|--------|
| `railway login` | **STOP** — CLI reports `Cannot login in non-interactive mode` (browser + browserless both fail in agent shell). User must run `railway login` in a local interactive terminal, then `railway link` selecting **staging/internal ONLY**, then `railway status`. |
| Linked identity / staging confirm | **NOT DONE** — waiting on user interactive login + staging selection |
| Vars / deploy / migrations | **NOT RUN** (stopped before vars, per plan) |
| Production Railway | **UNTOUCHED** |
