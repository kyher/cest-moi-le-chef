# c'est moi le chef

A personal recipe book — private by default, shareable when you're ready. Store recipes exactly how you make them, add notes after each cook, and share your best ones with anyone or keep them to yourself.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 11+
- A [Neon](https://neon.tech) PostgreSQL database

## Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in the values (see below)
pnpm db:migrate              # apply migrations
pnpm db:seed                 # optional: seed test data
pnpm dev                     # http://localhost:3000
```

The seed script creates a test account (`test@example.com` / `password`) with 10 sample recipes.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon connection string — get it from the Neon dashboard |
| `BETTER_AUTH_URL` | Yes | App URL (`http://localhost:3000` for local dev) |
| `BETTER_AUTH_SECRET` | Yes | Any string for local dev; use `openssl rand -base64 32` for production |
| `R2_ACCOUNT_ID` | Image uploads | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Image uploads | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | Image uploads | R2 API token secret |
| `R2_BUCKET_NAME` | Image uploads | R2 bucket name |
| `R2_PUBLIC_URL` | Image uploads | Public URL for the R2 bucket |

R2 is only needed if you're working on Cover Image upload functionality. The rest of the app runs without it.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the dev server on port 3000 |
| `pnpm build` | Build for production (generates Prisma client, runs migrations, then builds) |
| `pnpm start` | Serve the production build |
| `pnpm test` | Run tests (requires `.env.test.local`) |
| `pnpm lint` | Lint and auto-fix with Biome |
| `pnpm db:migrate` | Run pending migrations against the local database |
| `pnpm db:studio` | Open Prisma Studio for the local database |
| `pnpm db:seed` | Seed the local database with a test user and sample recipes |

## Tests

Tests require a separate database. Copy `.env.example` to `.env.test.local` and point `DATABASE_URL` at a different Neon branch or database, then:

```bash
pnpm db:migrate:test   # apply migrations to the test database
pnpm test
```

---

Built with [TanStack Start](https://tanstack.com/start), [Prisma](https://www.prisma.io/), [Better Auth](https://www.better-auth.com/), [Tailwind CSS](https://tailwindcss.com/), and [Biome](https://biomejs.dev/).
