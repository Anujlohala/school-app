# Oxford 2068 Circle

A private, responsive Dhukuti and shared-savings tracker for 11 school friends in Nepal.

This repository contains the application foundation and a member dashboard preview at `/dashboard`. The dashboard uses fictional sample records, with working All/Paid/Pending filters and responsive layouts. Its sample countdown is fixed to 18 September 2026. Authentication, database access, and financial mutations are intentionally not connected yet; the preview is not a protected production workspace.

## Local setup

Requirements:

- Node.js 22
- pnpm 12

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The placeholder application is available at `http://localhost:3000`. Environment values may remain empty for the scaffold routes.

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

- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [System design](docs/SYSTEM_DESIGN.md)
- [Database design](docs/DATABASE_DESIGN.md)
- [Internal API design](docs/API_DESIGN.md)

`docs/UX_DESIGN_BRIEF.md` is still expected but was not present when the scaffold was created.
