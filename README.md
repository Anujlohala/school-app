# Oxford 2068 Circle

A private, responsive Dhukuti and shared-savings tracker for 11 school friends in Nepal.

The application includes member sign-in at `/` and `/login`, administrator sign-in at `/admin/login`, and protected member routes. Login uses Supabase Auth and database-backed roles. The Members page uses a live roster, and the Cycles page supports administrator draft setup, an 11-member locked roster, atomic activation, an 11-month last-Saturday schedule, and meeting-date overrides. Shared members have read-only access to active cycle schedules. The dashboard still uses fictional sample records; winner, payment, and savings workflows are not connected. The sample countdown remains fixed to 18 September 2026.

Authentication and both account roles are configured and verified in development. Hosted database authorization checks passed. Real browser checks verified member/admin access, member denial of admin routes, logout for both roles, and protected access after logout. See the project status for the latest handoff.

## Local setup

Requirements:

- Node.js 22
- pnpm 12

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The application is available at `http://localhost:3000`. Populate the Supabase URL/key and server-only account email mappings in `.env.local` before running authentication. Never commit real credentials.

## Development database

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the ignored `.env.local`, then run `pnpm db:check`. This checks Auth connectivity, disabled public signup, and denied anonymous profile reads without fetching records. It does not verify member/admin sessions. See [database setup](supabase/README.md) for migration and account setup status.

## Scripts

| Command              | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `pnpm dev`           | Start the local Next.js development server    |
| `pnpm build`         | Create a production build                     |
| `pnpm start`         | Serve the production build                    |
| `pnpm format`        | Format tracked source and configuration files |
| `pnpm format:check`  | Verify formatting without changing files      |
| `pnpm lint`          | Run ESLint with zero warnings allowed         |
| `pnpm typecheck`     | Run strict TypeScript checking                |
| `pnpm test`          | Run the baseline unit test suite              |
| `pnpm test:coverage` | Run unit tests with coverage                  |

## Project boundaries

- `src/app` contains routes and layouts.
- `src/components` contains reusable interface and state components.
- `src/features` groups product-facing modules as they are implemented.
- `src/domain` is reserved for pure business rules.
- `src/server` is reserved for authenticated queries and commands.
- `src/lib` contains shared infrastructure helpers.
- `supabase` will contain versioned migrations and database tests.
- `tests` contains unit, integration, and end-to-end tests.

## Architecture documents

- [Project status and progress log](docs/PROJECT_STATUS.md)
- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [System design](docs/SYSTEM_DESIGN.md)
- [Database design](docs/DATABASE_DESIGN.md)
- [Internal API design](docs/API_DESIGN.md)

`docs/UX_DESIGN_BRIEF.md` is still expected but was not present when the scaffold was created.
