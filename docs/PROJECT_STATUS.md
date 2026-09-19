# Oxford 2068 Circle — Project status

Last updated: 19 September 2026 (Asia/Kathmandu)

## Current position

The scaffold, sample-data member dashboard, and Stage 2 authentication are implemented and verified in development. Member login is available at `/` and `/login`; administrator login is at `/admin/login`. Both accounts are provisioned with database-backed roles. Real browser checks verified member and administrator access, member denial of admin routes, logout for both roles, and protected access after logout. Supabase profile RLS and denied role mutations passed hosted database tests. Member management is now implemented with a live database roster and administrator editing. Financial queries and cycle/payment administration remain unimplemented; dashboard records are fictional sample data. This is not a production launch.

Build the application incrementally, one agreed feature at a time. Completing a feature does not authorize starting the next one; agree on its scope with the user first.

This file tracks implementation progress and handoff context. The product requirements, system design, API design, and database design remain the sources of truth for requirements and architecture.

## Feature tracker

| Feature                              | Status                                             | Delivered scope                                                                                                                                                                                                           | Remaining work                                                                                      |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Project scaffold                     | Implemented; user reviewed                         | Next.js, TypeScript, Tailwind, shared UI primitives and tokens, Manrope font, route/layout foundation, environment template, and development/check tooling                                                                | Connect infrastructure as individual features are built                                             |
| Member dashboard                     | Implemented with sample data; awaiting user review | Responsive overview at `/dashboard`, financial summaries, winner panel, 11 fictional member records, All/Paid/Pending filters, savings breakdown, cycle progress, sample meeting countdown, and read-only preview notices | User feedback and live database-backed queries                                     |
| Member login / homepage | Implemented; development verified | Real Supabase login, database role verification, HTTP-only sessions, logout, and protected member routes | Production configuration and launch checks |
| Administrator login | Implemented; development verified | Administrator login, role-protected admin page, dashboard access, and logout; members denied admin access | Financial administrator workflows |
| Database and access control | Authentication foundation verified | Both profiles provisioned; profile RLS, role isolation, denied client writes, disabled public signup, and connectivity checks | Cycle/payment schema, financial constraints and functions, RLS for future tables, and CLI migration history reconciliation |
| Members, cycles, and schedules       | Member roster implemented; cycles pending                                    | Live member list, admin add/edit/deactivate/reactivate, RLS, validation, and stale-edit protection | Real roster entry, cycle setup, activation, and meeting schedule management                         |
| Winner recording and payments        | Not implemented                                    | Sample read-only presentation on dashboard                                                                                                                                                                                | Atomic winner/obligation generation, payment recording, methods, and corrections                    |
| Savings and extra contributions      | Not implemented                                    | Sample dashboard savings breakdown                                                                                                                                                                                        | Live totals and administrator contribution workflows                                                |
| History and member records           | Scaffold placeholders only                         | Existing `/history`, `/months`, `/savings`, and `/members` routes                                                                                                                                                         | Complete read-only feature pages and connect their queries                                          |
| Historical reconciliation and launch | Not started                                        | Migration and launch requirements documented                                                                                                                                                                              | Enter the first 10 months, reconcile records, verify security, backups, restoration, and deployment |

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
- The `(protected)` route group now enforces authentication in its layout and each page; the Proxy redirects signed-out visitors before rendering. Admin pages also require the database admin role.

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

### 19 September 2026 — Login screens (Stage 1)

- Implemented member login as the homepage (`/`) and at `/login`, plus the administrator screen at `/admin/login`, using shared layout, form, and input components.
- Followed the Stitch centered white-card layout, pale green background, Manrope typography, and forest-green controls. Used username/password terminology from the requirements instead of mobile, email, or moderator-ID login.
- Added required-field errors with focus management, a password visibility toggle, member/admin switch links, and a separate sample-dashboard link.
- Submission is explicitly a preview: it sends no authentication request, creates no session, clears the sample password, and explains that sign-in is unconnected. No simulated success/loading, remember-device promise, signup, or password-reset workflow was added.
- Reviewed desktop/member and mobile/admin layouts; checked member validation, visibility toggle, preview submission, and navigation. Mobile layout had no horizontal overflow.
- Formatting, lint, existing unit tests, and production build passed. An initial strict TypeScript error was fixed; the standalone type check was rerun after the build to avoid concurrent generated-file changes.
- Stage 2 remains pending: development Supabase setup, the two accounts, role/profile migration with RLS, server authentication, sessions, logout, and access enforcement. Do not treat the login UI as a security boundary.

## How to maintain this file

1. Read this file at the start of project work, alongside the relevant design documents.
2. Update the feature tracker when a feature is started, changed, completed, or blocked.
3. Add a dated progress entry recording the scope delivered, verification actually performed, known limitations, and follow-up work. Preserve earlier entries; correct inaccuracies explicitly.
4. Keep the current position, handoff notes, and last-updated date consistent with the tracker.
5. Distinguish sample UI, connected functionality, tested behavior, and user approval. Do not mark a preview as a completed live feature or infer user acceptance.
6. Record meaningful fixes or decisions that affect later work. Never include API keys, passwords, real credentials, or sensitive member data.

Next step: user reviews member management and enters the real roster. Agree on cycle setup as the next increment before implementing it. Financial tables and workflows remain unimplemented.

### 19 September 2026 — Development Supabase foundation

- User confirmed this project is for development and authorized setup. Saved URL and publishable key only in ignored `.env.local` with owner-only permissions. No secret/service-role key added.
- Verified Auth and Data API connectivity. Disabled public signup through the authenticated project dashboard; anonymous sign-in was already disabled.
- Applied `20260919000000_create_profiles.sql` through the SQL Editor: two permitted roles with at most one identity per role, Auth user reference, automatic update timestamp, RLS, own-profile reads, and no client writes or anonymous access. No Auth users or profile rows provisioned.
- Added `pnpm db:check`; live checks passed for key acceptance, signup disabled, and anonymous profile reads denied. This is not a full authenticated authorization test.
- SQL Editor application does not register CLI migration history. Reconcile migration version `20260919000000` using the CLI before a future linked `db push`; see `supabase/README.md`.
- Dashboard remains sample data; login remains a preview. No financial schema or records created.
- Database structural assertions passed in the hosted SQL Editor: RLS enabled, anonymous SELECT denied, authenticated SELECT allowed with an own-profile policy, and authenticated mutations denied. Account-specific RLS tests remain pending.
- Formatting, lint, all three existing unit tests, production build, and TypeScript checks passed. The first sandboxed build could not resolve Google Fonts; the build passed when rerun with network access.

### 19 September 2026 — Authentication Stage 2 (in progress)

- User authorized administrator/member account creation and real login, logout, and protected routes. Server-only account mappings use the user-selected emails in ignored environment configuration; usernames are `admin` and `member`.
- Implemented server-only Supabase SSR sessions with HTTP-only cookies, secure cookies in production, SameSite=Lax, no-store responses, and Proxy token refresh.
- Login verifies the database profile role; guards verify the Auth user and role on every protected page and layout. No profile or unknown roles fail closed. Member access to admin routes redirects to the dashboard.
- Added a logout control that revokes the current session only. Login forms now submit real Server Actions, show pending/failure feedback, and no longer offer an unprotected preview link. Dashboard data remains explicitly fictional.
- New passwords must be entered and submitted by the user directly in the Supabase UI. Account creation and role provisioning pending.
- Verification: 23 unit tests passed, including forged input, role mismatch, missing/revoked profiles, session-cookie refresh, and logout failure. All six protected route roots returned 307 to their login page; login routes returned 200. Browser verified dashboard redirect and generic invalid-password feedback.
- Final formatting, lint, production build, and TypeScript checks passed. Hosted account-role SQL checks and successful-login/logout browser checks remain pending user password creation and profile assignment.

### 19 September 2026 — Auth accounts created

- User confirmed both accounts were created; verified both requested identities in the hosted Auth user list. Passwords were entered directly by the user.
- Prepared the exact role assignments for the verified user IDs. Assignment awaits the browser tool’s required confirmation for granting privileges. Successful login/logout browser checks remain pending.
- User explicitly confirmed role assignments; provisioned both profiles after validating matching confirmed Auth identities. Verified the resulting admin/member roles.
- Hosted `account_roles.sql` tests passed: each role sees only its own profile, member inserts/updates/deletes are denied, administrator profile mutation is denied, unprovisioned users see no profiles, and anonymous reads are denied. The test transaction rolled back.
- Awaiting user sign-in with the selected password for authenticated browser verification; passwords are not available to the agent.

### 19 September 2026 — Member browser verification

- User signed in with the shared-member account; observed the authenticated dashboard with Member · Read only status.
- Direct navigation to `/admin` returned the member to `/dashboard`, confirming route authorization with the real session.
- Clicked Sign out; returned to `/login`. A subsequent direct `/dashboard` request also returned to `/login`.
- No application code changes were needed. Prior automated checks remain applicable; only status documentation changed. Administrator login is prepared for the user to complete the remaining browser verification.

### 19 September 2026 — Administrator browser verification

- Observed the user’s authenticated administrator session at `/admin`, including the administrator role and Administration navigation.
- Verified the administrator can open `/dashboard` while retaining the administrator role.
- Signed out successfully; direct navigation to `/admin` then redirected to `/admin/login`. The browser is left signed out after this test.
- Stage 2 authentication is implemented and verified in development. Both roles now have real login/logout browser coverage; member denial of admin access and database role isolation were verified earlier. Token refresh has automated coverage; expiry-driven refresh and production deployment have not been browser-tested.
- Documentation-only update; formatting checked. No application code changed, so the preceding 23 passing tests, lint, type check, and production build remain applicable. Financial records remain sample data, and admin financial tools remain placeholders.

### 19 September 2026 — Member management

- User confirmed both login/logout flows worked and requested the next incremental feature. Built member management: live `/members` roster, admin add/rename/deactivate/reactivate, and an Administration entry point. Shared-member access remains read-only.
- Applied `20260919010000_create_members.sql` through the hosted SQL Editor: members table, fixed-search-path `is_admin()` helper, RLS, admin-only inserts/updates, read access for provisioned accounts, no client deletes, automatic timestamps, and case-insensitive active-name uniqueness.
- Names are trimmed and limited to 120 characters in server validation and database constraints. Updates compare the last-read timestamp so stale edits do not overwrite newer changes. Deactivation preserves identities; the 11-person rule belongs to future cycle activation, not the global roster.
- Hosted `members_access.sql` passed for administrator inserts/updates, duplicate-name rejection, inactive-name reuse, conflicting reactivation rejection, member read-only access, unprovisioned account isolation, and anonymous denial. All fixture records rolled back; no real names were imported.
- Browser verified the authenticated administrator’s live empty roster and add form. A pre-migration development error cleared after a full page reload once the table was available. Successful form submission with real roster data remains for user review.
- Dashboard remains fictional sample data. Updated the shared notice to distinguish it from the live roster. No cycles, payments, or savings tables were introduced.
- This migration was applied via SQL Editor; reconcile both migration versions in CLI history before the first linked `db push`.
- Final verification: all 34 unit tests, formatting, lint, TypeScript, and production build passed. Browser submission of whitespace-only input was rejected by the real server action without creating a row. The Members page is left ready for real roster entry under the existing administrator session.
