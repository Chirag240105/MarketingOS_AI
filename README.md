# MarketingOS AI

MarketingOS AI is an agentic marketing workspace built for the H0: Hack the Zero Stack with Vercel v0 and AWS Databases hackathon. It turns brand context into strategy, reviewable content, schedules, simulated publishing, and analytics learning.

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS, React Hook Form, Zod, Framer Motion, Recharts, Lucide
- Auth.js credentials authentication with Prisma persistence
- Prisma 7 with PostgreSQL and the required PostgreSQL driver adapter
- Docker PostgreSQL locally; Amazon Aurora PostgreSQL for the Vercel showcase
- OpenAI structured-output agents with deterministic mock mode when no API key is configured
- Vercel Cron, Vercel Blob uploads, and Stripe webhook structure

## Local development

1. Copy `.env.example` to `.env`. Set `AUTH_SECRET` and `CRON_SECRET`; generate each with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
   For Google sign-in, create a Web application OAuth client in Google Cloud Console, add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI, then set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`. The Google button appears only after both are set.
   For OpenRouter, set `OPENROUTER_API_KEY` and choose an `OPENROUTER_MODEL`; the app uses its OpenAI-compatible API endpoint automatically. The AWS variables are connection-ready placeholders: Aurora uses `DATABASE_URL`, while the S3 variables can be used when object storage is added.
2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Generate the client, migrate, and seed:

```bash
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

Demo login: `demo@marketingos.ai` / `demo123456`.

## Aurora PostgreSQL and Vercel

For the final showcase, provision an Amazon Aurora PostgreSQL cluster, ensure Vercel can reach it through your chosen networking path, and replace Vercel's `DATABASE_URL` with the Aurora PostgreSQL connection string. Do not change the Prisma schema or application code.

Run `npm run db:deploy` as a controlled release step against Aurora. Configure `AUTH_SECRET`, `CRON_SECRET`, and optional OpenAI, Vercel Blob, and Stripe variables in Vercel. The `vercel.json` cron jobs invoke the scheduling and analytics sync endpoints; Vercel sends the authorization header automatically using `CRON_SECRET`.

## Production notes

- All workspace mutations enforce membership roles on the server.
- Agent and publish activity are persisted with audit events and state transitions.
- Real Meta, X, and LinkedIn publishing adapters have isolated interfaces; mock providers make the MVP demo-ready without social OAuth credentials.
- Use an Aurora connection strategy appropriate to your deployment topology and avoid exposing database URLs to the browser.
