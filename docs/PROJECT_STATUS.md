# Oxford 2068 Circle — Project status

Last updated: 18 September 2026 (Asia/Kathmandu)

## Current position

The project scaffold and the member dashboard with fictional sample data are implemented. The dashboard is ready for user review. Authentication, database access, and financial mutations are not connected, so this is a UI preview rather than a production-ready application.

Build the application incrementally, one agreed feature at a time. Completing a feature does not authorize starting the next one; agree on its scope with the user first.

This file tracks implementation progress and handoff context. The product requirements, system design, API design, and database design remain the sources of truth for requirements and architecture.

## Feature tracker

| Feature                              | Status                                             | Delivered scope                                                                                                                                                                                                           | Remaining work                                                                                        |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Project scaffold                     | Implemented; user reviewed                         | Next.js, TypeScript, Tailwind, shared UI primitives and tokens, Manrope font, route/layout foundation, environment template, and development/check tooling                                                                | Connect infrastructure as individual features are built                                               |
| Member dashboard                     | Implemented with sample data; awaiting user review | Responsive overview at `/dashboard`, financial summaries, winner panel, 11 fictional member records, All/Paid/Pending filters, savings breakdown, cycle progress, sample meeting countdown, and read-only preview notices | User feedback, authentication, and live database-backed queries                                       |
| Member login / homepage              | Scaffold placeholder only                          | Existing `/login` route; Stitch login design identified as the intended homepage                                                                                                                                          | Implement the approved design and later connect authentication; homepage routing remains to be agreed |
| Administrator login                  | Scaffold placeholder only                          | Existing `/admin/login` route                                                                                                                                                                                             | Login interface and administrator authentication                                                      |
| Database and access control          | Not implemented                                    | Supabase dependencies and module boundaries prepared                                                                                                                                                                      | Migrations, constraints, transactional functions, authentication roles, and Row Level Security        |
| Members, cycles, and schedules       | Not implemented                                    | Route placeholders and documented rules                                                                                                                                                                                   | Persistent roster, cycle setup, activation, and meeting schedule management                           |
| Winner recording and payments        | Not implemented                                    | Sample read-only presentation on dashboard                                                                                                                                                                                | Atomic winner/obligation generation, payment recording, methods, and corrections                      |
| Savings and extra contributions      | Not implemented                                    | Sample dashboard savings breakdown                                                                                                                                                                                        | Live totals and administrator contribution workflows                                                  |
| History and member records           | Scaffold placeholders only                         | Existing `/history`, `/months`, `/savings`, and `/members` routes                                                                                                                                                         | Complete read-only feature pages and connect their queries                                            |
| Historical reconciliation and launch | Not started                                        | Migration and launch requirements documented                                                                                                                                                                              | Enter the first 10 months, reconcile records, verify security, backups, restoration, and deployment   |

## Dashboard handoff

- Preview route: `/dashboard` (locally, `http://localhost:3000/dashboard`).
- Reference: Google Stitch project **Oxford 2068 Circle Web App**, project ID `13900062405148295433`; desktop **Member Dashboard - Overview** and **Mobile Member Dashboard**.
- The user clarified that “homepage” means the member login screen. The feature built first is the member dashboard, not a finished login homepage.
- The user approved using clearly labelled sample data before connecting live features. No actual member financial records have been imported.
- Sample scenario: Cycle 1, Month 11; eight paid members, three pending; NPR 16,200 received and NPR 6,900 pending in monthly dues.
- Sample saving balance: NPR 22,700, comprising NPR 11,800 fixed savings, NPR 10,400 winner interest, NPR 500 extras, and NPR 0 carried balance. NPR 900 pending savings/interest is excluded.
- The winner panel separates the calculated NPR 20,000 payout from NPR 14,000 principal received so far.
- The meeting countdown is a fixed sample: eight days from 18 September to 26 September 2026. It is not a live clock.
- Shared navigation was adapted for the member view. Links to unfinished features still lead to scaffold placeholders.
- Main implementation: `src/app/(protected)/dashboard/page.tsx`, `src/features/dashboard/`, and `src/components/layout/`.
- The `(protected)` route group is a structural placeholder; it does not currently enforce authentication.

## Progress log

### 18 September 2026 — Project scaffold

- Reviewed all four design documents and `AGENTS.md` before development.
- Verified the nine scaffold routes responded successfully and an unknown route returned 404.
- The user confirmed that the scaffold was working and looked good.

### 18 September 2026 — Member dashboard preview

- Implemented the agreed sample-data dashboard with shared UI primitives and a primarily server-rendered page; payment filters and active navigation use focused Client Components.
- Verified the All/Paid/Pending filters, desktop layout, and 390px mobile layout. The mobile page had no horizontal overflow, and browser checks reported no errors.
- Passed formatting, lint, TypeScript, unit tests (three tests across two files), and the production build. Added sample financial reconciliation tests.
- Recovered an unresponsive development server reporting `EPIPE`; restarted it with output directed to `/private/tmp/school-app-next-dev.log`. The dashboard returned HTTP 200 and loaded in the browser afterward. A running local server is temporary state, not a deployment guarantee.
- Awaiting the user's review of the dashboard before deciding the next feature.

### 18 September 2026 — Progress tracking

- Added this project status file and contributor instructions requiring future updates alongside feature work.
- Documentation-only change; formatting checked. Application checks were not rerun for this documentation update.

## How to maintain this file

1. Read this file at the start of project work, alongside the relevant design documents.
2. Update the feature tracker when a feature is started, changed, completed, or blocked.
3. Add a dated progress entry recording the scope delivered, verification actually performed, known limitations, and follow-up work. Preserve earlier entries; correct inaccuracies explicitly.
4. Keep the current position, handoff notes, and last-updated date consistent with the tracker.
5. Distinguish sample UI, connected functionality, tested behavior, and user approval. Do not mark a preview as a completed live feature or infer user acceptance.
6. Record meaningful fixes or decisions that affect later work. Never include API keys, passwords, real credentials, or sensitive member data.

Next step: review the member dashboard with the user and agree on the next small increment.
