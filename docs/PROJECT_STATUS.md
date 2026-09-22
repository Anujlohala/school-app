# Oxford 2068 Circle — Project status

Last updated: 22 September 2026 (Asia/Kathmandu)

## Current position

Live login: https://school-app-fawn-phi.vercel.app/login. On 22 September 2026, the user reported that GitHub is connected to Vercel, environment configuration is complete, and the live site is working. This update does not independently verify which commit is deployed or whether pending database migrations have been applied.

The app is deployed on Vercel, and the user confirmed production member and administrator sign-in after adding the missing account-email environment variables. Member management uses a live database roster with administrator editing. Cycle 1 is active in the development database with an 11-member roster and adjusted historical meeting dates. The reviewed-version activation migration and the monthly winner/obligation migration are applied to hosted Supabase and passed rollback-only authorization and calculation checks. Administrators can record each in-person Chitta result in month order; the database then opens that month and creates 11 immutable due snapshots. Both roles can read the winner, payout, and obligation breakdown. Review fixes constrain mobile obligation tables to their cards and require fresh winner confirmation when the month identity or reviewed timestamp changes. No real winner has been entered by this implementation. Dashboard records remain fictional sample data, and payment settlement and savings workflows are still unimplemented. The winner feature and its review fixes are included in the `dev` branch handoff. Production deployment of the new winner code has not been verified.

Build the application incrementally, one agreed feature at a time. Completing a feature does not authorize starting the next one; agree on its scope with the user first.

This file tracks implementation progress and handoff context. The product requirements, system design, API design, and database design remain the sources of truth for requirements and architecture.

## Feature tracker

| Feature                              | Status                                             | Delivered scope                                                                                                                                                                                                           | Remaining work                                                                                      |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Project scaffold                     | Implemented; user reviewed                         | Next.js, TypeScript, Tailwind, shared UI primitives and tokens, Manrope font, route/layout foundation, environment template, and development/check tooling                                                                | Connect infrastructure as individual features are built                                             |
| Member dashboard                     | Implemented with sample data; awaiting user review | Responsive overview at `/dashboard`, financial summaries, winner panel, 11 fictional member records, All/Paid/Pending filters, savings breakdown, cycle progress, sample meeting countdown, and read-only preview notices | User feedback and live database-backed queries                                     |
| Member login / homepage | Implemented; production sign-in confirmed | Real Supabase login, database role verification, HTTP-only sessions, logout, and protected member routes | Expiry-driven production session check |
| Administrator login | Implemented; production sign-in confirmed | Administrator login, role-protected admin page, dashboard access, and logout; members denied admin access | Financial administrator workflows |
| Database and access control | Winner foundation implemented and hosted | Profiles, members, cycles, monthly obligation snapshots; RLS, role isolation, denied direct financial writes, and atomic administrator functions | Payment-settlement and savings constraints/functions; CLI migration history reconciliation |
| Members, cycles, and schedules       | Implemented; Cycle 1 active in development | Live roster management; cycle draft setup; exactly 11 selected members; immutable activated rules and roster; generated last-Saturday schedule; meeting-date overrides; read-only member view | Production deployment verification |
| Winner recording and payments        | Winner and obligation generation implemented; user reviewed | Administrator records the in-person Chitta winner in month order with confirmation tied to the reviewed month version; atomic 11-member due snapshots; calculated payout; responsive read-only breakdown for both roles | Production deployment; payment settlement, methods, corrections, and dashboard connection |
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

Next step: verify deployment of the reviewed winner feature. The administrator can record the real in-person Chitta results in month order; no winner was submitted during automated or browser verification. Confirm the scope of payment settlement and administrator corrections before implementing the proposed next increment. Financial dashboard data remains unconnected.

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

### 22 September 2026 — Cycle setup and monthly schedule

- Implemented `/months` as the cycle administration and read-only schedule page. Administrators can save a draft with a starting month, whole-NPR contribution rules, and exactly 11 active members; activation requires explicit confirmation and locks the rules and ordered roster.
- Added pure cycle validation and schedule generation. Activation creates 11 monthly rows on the last Saturday of each Gregorian month, including year boundaries. Administrators may override individual active-cycle meeting dates; shared members can only read active or completed schedules.
- Applied `20260922000000_create_cycles.sql` through the hosted SQL Editor. The schema separates cycles, cycle rosters, and cycle months, enables RLS, denies direct client writes, and exposes fixed-search-path administrator functions for atomic draft saving, activation, and date overrides.
- Hosted `cycles_access.sql` passed for atomic activation, expected boundary dates, override behavior, direct-write denial, locked active cycles, member read-only access, unprovisioned account isolation, and anonymous denial. All fixtures rolled back, so no cycle was created by the tests.
- The live roster currently has 12 active entries. No Cycle 1 draft or active cycle was created because selecting the 11 participants is an administrator decision. A shared-member browser check verified the empty read-only `/months` state without administrator controls.
- Final verification passed formatting, lint, strict TypeScript, all 41 unit tests, the production build, and the live `pnpm db:check`. The administrator setup flow has automated and database coverage but still needs a browser review with the administrator session.
- The cycle migration was applied via SQL Editor. Reconcile migration versions `20260919000000`, `20260919010000`, and `20260922000000` in CLI history before the first linked `db push`. The code remains uncommitted and is not yet deployed.

### 22 September 2026 — Cycle review fixes

- User requested fixes for both review findings. Draft amount fields now preserve entered values after failed actions so retries submit the intended amounts.
- Activation confirmation is tied to the cycle ID and exact reviewed timestamp, and changing either requires a new confirmation. The server validates the timestamp and confirmation, preserves timestamp precision, and gives a specific reload/review message for a stale draft.
- Added follow-up migration `20260922010000_require_reviewed_cycle_version.sql`: checks the reviewed timestamp under the cycle row lock before creating months and removes the old activation RPC. The previously applied migration remains unchanged.
- Added component regressions for failed-save retries and changed-draft confirmation, action tests for version forwarding and conflict handling, and SQL regressions for stale/missing versions, rollback behavior, and removal of the unversioned RPC.
- Verification passed: all 46 unit/component tests, formatting, lint, strict TypeScript, and the production build. Component regressions exercise failed-save retries and confirmation reset after version changes. The Docker daemon is unavailable, so SQL regressions have not run locally. The follow-up migration is not applied to hosted Supabase; applying it and running the database tests are required before using the updated activation flow. No cycle records were created or changed.

### 22 September 2026 — GitHub handoff

- User requested updating project status, committing the current cycle implementation and both review fixes, and pushing the changes to GitHub. Delivery branch: `dev`.
- Scope includes cycle draft setup, locked rosters, monthly schedules, date overrides, reviewed-version activation, preserved amounts after failed saves, migrations, regression tests, and documentation.
- Prior checks for this exact application code passed: all 46 unit/component tests, formatting, lint, strict TypeScript, and the production build. This handoff only updates status documentation; application checks were not repeated.
- Still pending: apply migration `20260922010000_require_reviewed_cycle_version.sql`, run the updated SQL tests, review the administrator setup flow, and verify deployment. The original cycle migration is applied; the follow-up activation migration is not. No database records were changed during this handoff.

### 22 September 2026 — User deployment update

- User supplied the live Vercel login URL above and confirmed GitHub integration, environment configuration, and a working deployment.
- Recorded the report without changing application code or deployment settings. No independent deployment checks were requested or performed; existing migration and feature verification requirements remain unchanged.

### 22 September 2026 — Monthly winner and obligation generation

- Implemented the agreed next increment on `/months`. An administrator can select the result of the in-person Chitta draw, explicitly confirm it, and record one winner at a time in month order. Changing the selection clears confirmation, and a reviewed month timestamp prevents stale submissions.
- Added an atomic fixed-search-path database function that locks the cycle, validates the active cycle roster and one-win-per-member rule, opens the selected month, and creates exactly 11 obligation snapshots. The current winner owes fixed saving only; previous winners also owe winner interest; members who have not won owe contribution plus fixed saving. Payout is `(member count - 1) × contribution`.
- Added `member_monthly_payments` with generated totals, pending/paid settlement consistency, RLS, authenticated read access for provisioned roles, and no direct authenticated writes. Payment settlement remains outside this increment; all generated records start pending.
- Applied the pending reviewed-version activation migration and the new monthly-obligation migration to hosted Supabase. The hosted rollback-only test passed calculation, month-order, immutability, administrator authorization, member read-only, and anonymous-denial checks. It detected an existing active Cycle 1 and restored all existing records unchanged after testing.
- Added server-action and confirmation-form regressions. Formatting, lint, strict TypeScript, 50 unit/component tests, and the production build passed. The local member session rendered the active Cycle 1 schedule successfully after the migration. No real winner was recorded, because that value must come from the administrator's actual Chitta result.
- Awaiting administrator review of the winner form and production deployment. The dashboard still uses sample financial data; payment settlement, corrections, savings, and live dashboard aggregation remain future increments.

### 22 September 2026 — Winner review fixes

- User requested fixes for both review findings. Schedule sections and month cards can now shrink within their grid tracks, keeping obligation tables horizontally scrollable within the card. The scroll region has a keyboard focus target and a month-specific accessible label.
- Winner confirmation now includes the month ID, exact reviewed timestamp, and selected winner. Changing the month or its version clears the effective confirmation; unrelated renders preserve a valid review. Added regressions for both changes and verified that reconfirmed submission forwards the latest identifiers.

### 22 September 2026 — Winner feature approved

- User confirmed that the monthly winner and obligation feature was checked and its code review was completed.
- Agreed planning direction: the next proposed increment is payment settlement and administrator corrections. Implementation has not started.
- Verification passed: all 52 unit/component tests, formatting, lint, strict TypeScript, and the production build. Headless Chrome checks used the actual page components and production CSS with fictional member/admin fixtures at 320, 390, 768, 1024, and 1440px. Tables remained inside their cards, scrolled through the final column, and accepted keyboard focus without page overflow. At 390px the scroll container is now 290px wide instead of the previously clipped 620px.
- No database or financial calculation changes were needed; hosted SQL tests were not rerun and no real winner was recorded. Production deployment verification remains pending; user review is recorded above. These review fixes are included in the `dev` branch handoff.

### 22 September 2026 — Winner feature GitHub handoff

- User requested updating project status and committing and pushing the current winner feature and review fixes to GitHub. Delivery branch: `dev`.
- Scope includes atomic winner recording and obligation generation, read-only obligation breakdowns, the mobile scrolling fix, confirmation tied to the reviewed month version, migration and SQL checks, and regression tests.
- Existing verification remains applicable: all 52 unit/component tests, formatting, lint, strict TypeScript, production build, and responsive fixture checks passed before this documentation-only handoff. No application or database behavior changed during the handoff.
- Production deployment verification remains pending. Payment settlement and administrator corrections are the proposed next increment; implementation has not started.
