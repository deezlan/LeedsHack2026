## Branching
- main: stable, demo-ready
- feature branches: feat/<area>-<short-desc>
  - examples: feat/contracts, feat/db-users, feat/matching-core, feat/ai-tags

## PR size
Keep PRs small (ideally < ~300 lines) and merge often.

## Ownership
- A: /app/** UI pages + UI components
- B: /lib/db.ts, /app/api/users/**, /app/api/requests/**, /seed/**
- C: /lib/matching.ts, /app/api/matches/**
- D: /app/api/ai/**, /components/ai/**

Shared file: lib/types.ts (ping team before changing)
