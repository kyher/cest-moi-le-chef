# Netlify as deployment target with Netlify Database

The app deploys to Netlify rather than a self-managed VPS. Netlify is TanStack Start's official deployment partner and provides a zero-config integration via `@netlify/vite-plugin-tanstack-start`. The database is Netlify Database (serverless Postgres powered by Neon), chosen over provisioning a standalone Neon account because it is automatically provisioned and managed within the Netlify project, and provides a separate database branch per Deploy Preview.

## Considered options

**Netlify Database vs standalone Neon.** Netlify Database is Neon under the hood but removes the need for a separate account and wires the `DATABASE_URL` automatically. The per-Deploy-Preview branching is a bonus. The only trade-off is that it requires a Netlify credit-based plan; for a personal project this is acceptable.

**`@prisma/adapter-neon` vs `@prisma/adapter-pg`.** Netlify Functions are serverless — each invocation may open a fresh TCP connection. Under `@prisma/adapter-pg` this exhausts Postgres connection limits. `@prisma/adapter-neon` uses HTTP instead of TCP, which is stateless by nature and has no connection limit issue. In local development `@prisma/adapter-pg` is used against Docker Postgres, since the local Postgres instance does not speak Neon's HTTP protocol.
