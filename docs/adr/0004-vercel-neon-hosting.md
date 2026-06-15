# Vercel + Neon for hosting and database

The app is deployed to Vercel using TanStack Start's Vercel Nitro preset, with PostgreSQL hosted on Neon.

## Considered options

**VPS (self-managed) and Fly.io were both attempted and abandoned.** Operational friction — configuring persistent storage, managing containers, wiring up Coolify — cost more time than it was worth for a personal project. Vercel eliminates that entire layer: push to main, it deploys.

**Neon over other managed Postgres providers.** Vercel's serverless functions spawn a fresh process per request, which exhausts a regular Postgres connection pool under any load. Neon's serverless driver (`@neondatabase/serverless`) uses HTTP/WebSockets instead of persistent TCP connections, making it safe in a function-per-request environment without a separate connection pooler. Neon also has a free tier that covers this workload.

## Consequences

- Migrations run at build time (`prisma migrate deploy` in the Vercel build command) rather than at container startup. A failing migration blocks the deploy.
- The `@prisma/adapter-pg` adapter is replaced by `@prisma/adapter-neon`.
- `Dockerfile`, `docker-compose.yml`, and `entrypoint.sh` are removed — they have no role in this deployment model.
