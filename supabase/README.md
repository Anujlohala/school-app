# Development database

The development project connection lives in ignored `.env.local`. Run `pnpm db:check` to verify Auth, signup configuration, and anonymous profile access. The script uses only the publishable key and requests zero rows.

## Applied foundation

`migrations/20260919000000_create_profiles.sql` was applied through the project SQL Editor on 19 September 2026. It creates the role table with RLS and read-own-profile access. Clients cannot create, edit, or delete roles. Public signup is disabled in the hosted Auth settings (a separate setting, not part of the SQL migration).

The SQL Editor does not register files in the CLI migration ledger. Before the first linked migration push, log in to the CLI, link the intended development project, verify the schema matches the migrations, and repair the applied versions listed below. Do not reapply the create-table migrations to this project. New empty environments should apply them normally.

`tests/profiles_access.sql` checks database grants and the RLS policy structure in the SQL Editor. Account-specific checks in `tests/account_roles.sql` also passed after provisioning.

## Account provisioning and authentication

Provision one administrator and one shared-member Auth account through trusted project management. The user enters new passwords directly in Supabase. Assign the corresponding `admin` and `member` profiles and populate the server-only email mappings. The app accepts usernames `admin` and `member`; emails and passwords are never committed.

Login/logout actions, request-scoped SSR clients, Proxy session refresh, and route/role guards are implemented. Cookie-based sessions are HTTP-only and Secure in production. Logout uses local scope so it does not sign out other devices using the shared account. Financial records remain sample data.

Run `tests/account_roles.sql` through the SQL Editor after provisioning to check role isolation and denied profile mutations inside a rolled-back transaction. These checks complement application tests; manually verify both real login flows and logout using the selected passwords. Both Auth accounts and profiles are provisioned in development, and the hosted account-role tests passed. Both real login flows, member denial of admin access, administrator dashboard access, logout for both roles, and protected access after logout are browser-verified in development. Expiry-driven token refresh has automated coverage but has not been browser-tested.

## Member roster

Migration `20260919010000_create_members.sql` is applied to development through SQL Editor. It adds `members` and the `is_admin()` helper. Provisioned users may read the roster; only administrators may insert/update; clients cannot delete members. Active names are unique ignoring case, and trimmed names have a 120-character limit.

`tests/members_access.sql` passed on the hosted development database and rolls back its test records. Manage the live roster in `/members` as administrator.

## Cycle setup and schedule

Migration `20260922000000_create_cycles.sql` is applied to development through SQL Editor. It adds cycle rules, an ordered 11-member roster, and monthly schedule tables. Provisioned users may read active cycles; administrators may also read drafts. All mutations use administrator-only database functions so draft saving and activation remain atomic and client totals or roles are never trusted.

Activation validates 11 unique active members, locks the roster and financial rules, and creates 11 monthly rows on each month's last Saturday. Administrators can override an active month's meeting date. Direct client writes are denied. `tests/cycles_access.sql` passed on the hosted development database and rolls back its fixtures.

Before linked CLI pushes, verify the applied schema and repair migration history for `20260919000000`, `20260919010000`, and `20260922000000` as applied. The SQL Editor does not register CLI migration versions.

### Pending activation fix

Apply `migrations/20260922010000_require_reviewed_cycle_version.sql` before using the updated activation UI. It replaces the original activation RPC with one requiring the exact reviewed `updated_at` timestamp. The check runs after locking the cycle; missing or stale versions fail before any schedule rows are created. The old one-argument RPC is removed so it cannot bypass the check. The previously applied cycle foundation migration is unchanged.

This follow-up migration has not yet been applied to the hosted database. After applying it, run `tests/cycles_access.sql` in a development database without an existing draft or active cycle. It includes stale/missing-version rejection, no partial schedule creation, and successful activation using the current version. All fixtures roll back. Do not mark this new migration applied in CLI history until it has actually run.
