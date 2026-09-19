# Supabase sessions

`server.ts` creates a new request-scoped SSR client. `src/proxy.ts` refreshes tokens, forwards refreshed cookies to rendering and the browser, and prevents caching. All authentication runs server-side, so cookies are HTTP-only, SameSite=Lax, and Secure in production. There is intentionally no browser Supabase client.

Server Components use the read-only cookie adapter; Server Actions explicitly request writable cookies. Protected queries verify the user with Supabase Auth and read the current role through RLS. Future administrator actions must independently call `requireAccount(true)` and use the authenticated client, never a service-role client.

Development connection values and account email mappings live only in ignored `.env.local`. `pnpm db:check` verifies connectivity, disabled signup, and anonymous profile restrictions. See `supabase/README.md` for database setup.
