# Development database

The development project connection lives in ignored `.env.local`. Run `pnpm db:check` to verify Auth, signup configuration, and anonymous profile access. The script uses only the publishable key and requests zero rows.

## Applied foundation

`migrations/20260919000000_create_profiles.sql` was applied through the project SQL Editor on 19 September 2026. It creates the role table with RLS and read-own-profile access. Clients cannot create, edit, or delete roles. Public signup is disabled in the hosted Auth settings (a separate setting, not part of the SQL migration).

The SQL Editor does not register files in the CLI migration ledger. Before the first linked migration push, log in to the CLI, link the intended development project, verify the schema matches the migrations, and repair the applied versions listed below. Do not reapply the create-table migrations to this project. New empty environments should apply them normally.

`tests/profiles_access.sql` checks database grants and the RLS policy structure in the SQL Editor. Account-specific checks in `tests/account_roles.sql` also passed after provisioning.

## Account provisioning and authentication

Provision one administrator and one shared-member Auth account through trusted project management. The user enters new passwords directly in Supabase. Assign the corresponding `admin` and `member` profiles and populate the server-only email mappings. The app accepts usernames `admin` and `member`; emails and passwords are never committed.

Login/logout actions, request-scoped SSR clients, Proxy session refresh, and route/role guards are implemented. Cookie-based sessions are HTTP-only and Secure in production. Logout uses local scope so it does not sign out other devices using the shared account. The dashboard still uses sample financial data; the roster, cycles, obligations, payments, and saving page use hosted development records.

Run `tests/account_roles.sql` through the SQL Editor after provisioning to check role isolation and denied profile mutations inside a rolled-back transaction. These checks complement application tests; manually verify both real login flows and logout using the selected passwords. Both Auth accounts and profiles are provisioned in development, and the hosted account-role tests passed. Both real login flows, member denial of admin access, administrator dashboard access, logout for both roles, and protected access after logout are browser-verified in development. Expiry-driven token refresh has automated coverage but has not been browser-tested.

## Member roster

Migration `20260919010000_create_members.sql` is applied to development through SQL Editor. It adds `members` and the `is_admin()` helper. Provisioned users may read the roster; only administrators may insert/update; clients cannot delete members. Active names are unique ignoring case, and trimmed names have a 120-character limit.

`tests/members_access.sql` passed on the hosted development database and rolls back its test records. Manage the live roster in `/members` as administrator.

## Cycle setup and schedule

Migration `20260922000000_create_cycles.sql` is applied to development through SQL Editor. It adds cycle rules, an ordered 11-member roster, and monthly schedule tables. Provisioned users may read active cycles; administrators may also read drafts. All mutations use administrator-only database functions so draft saving and activation remain atomic and client totals or roles are never trusted.

Activation validates 11 unique active members, locks the roster and financial rules, and creates 11 monthly rows on each month's last Saturday. Administrators can override an active month's meeting date. Direct client writes are denied. `tests/cycles_access.sql` passed on the hosted development database and rolls back its fixtures.

Before linked CLI pushes, verify the applied schema and repair migration history for every migration through `20260922040000` as applied. The SQL Editor does not register CLI migration versions.

## Winner generation and payment settlement

Migrations `20260922010000_require_reviewed_cycle_version.sql`, `20260922020000_add_monthly_obligations.sql`, and `20260922030000_add_payment_settlement.sql` are applied to development. They enforce reviewed cycle activation, atomic monthly winner and obligation generation, and administrator-only full-payment transitions with reviewed timestamps. The corresponding hosted rollback-only tests passed without changing existing records.

## Saving fund and extra contributions

Migration `20260922040000_create_saving_fund.sql` is applied to development. It adds administrator-only extra contribution RPCs, authenticated read access with RLS, and an invoker-security saving summary view. Received fixed saving and interest come only from paid obligation snapshots; pending saving remains separate and is excluded from the available balance.

`tests/saving_fund.sql` passed on the hosted development database. It creates isolated cycle fixtures, verifies totals, corrections, optimistic locking, role isolation, and anonymous denial, then rolls the transaction back. Manage and review the live fund in `/savings`. No extra contribution was created during verification.
