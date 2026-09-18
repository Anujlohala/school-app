<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Oxford 2068 Circle contributor guide

## Source of truth

Read the relevant files under `docs/` before changing product, financial, database, API, security, or interface behavior. Do not silently replace a documented decision. Raise contradictions before implementation.

## Project progress tracking

- Read `docs/PROJECT_STATUS.md` at the start of project work to recover the current implementation state, agreed scope, and outstanding work.
- Build incrementally, one user-agreed feature at a time. Do not automatically start another feature after completing the current one.
- Whenever a feature is started, implemented, changed, completed, or blocked, update `docs/PROJECT_STATUS.md` in the same change before handing off. Also record meaningful fixes and decisions that affect future work.
- Update the feature tracker, current position, handoff notes, and last-updated date as needed; append a dated progress entry with the delivered scope, checks actually performed, limitations, and next steps.
- Preserve the progress history and distinguish sample-data previews from connected functionality. Record user approval only when explicitly given; do not mark unfinished or unverified behavior complete.
- Keep credentials and sensitive member data out of status records. This file tracks progress and does not override the four design documents.

## Architecture boundaries

- Keep the application as a modular Next.js monolith.
- Default pages and layouts to Server Components. Add `"use client"` only around browser interaction.
- Keep pure rules in `src/domain`; they must not import React, Next.js, or Supabase.
- Keep reads in `src/server/queries` and mutations in `src/server/actions`.
- Treat PostgreSQL and its constraints as the financial source of truth.
- Never trust totals, roles, or calculated amounts from the browser.
- Never expose a Supabase secret or service-role key to client code.
- Row Level Security is required from the first database migration.
- Keep Dhukuti principal, fixed savings, winner interest, and extra contributions separate.

## Product boundaries

- There is no public signup.
- Member access is read-only; administrator writes require server and database authorization.
- Use whole NPR amounts and Gregorian dates in `Asia/Kathmandu`.
- V1 does not process payments, choose winners, support partial payments, apply penalties, or track withdrawals and gathering expenses.

## Interface rules

- Use the shared tokens in `src/app/globals.css` and primitives in `src/components/ui`.
- Preserve accessible contrast, visible focus styles, semantic labels, and 44px touch targets.
- Keep the interface responsive, restrained, and community-focused.
- Do not imply that placeholder authentication or financial data is functional.

## Quality checks

Before handing off a change, run the checks relevant to it:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Add production dependencies only when they have a documented responsibility. Keep `.env.example` descriptive and never commit real credentials.
