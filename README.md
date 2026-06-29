# MarketingOS AI

MarketingOS AI is a Next.js marketing operations workspace for creating brand-aware campaigns, generating reviewable social posts, approving/scheduling content, publishing through connected social accounts, and syncing provider analytics.

## Tech stack

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS
- Auth.js / NextAuth credentials login with optional Google OAuth
- Prisma 7 with PostgreSQL
- Groq, Gemini, and Mistral direct-provider AI fallback layer
- AWS S3 upload support for generated or uploaded assets
- Meta, LinkedIn, and X OAuth/publishing integrations
- Hugging Face / Pollinations image generation for ad creatives
- Stripe webhook and Vercel Cron endpoints

## Security note

Local secrets live in `.env`, which is ignored by git. If credentials have ever
been pasted or shared outside your deployment environment, rotate them outside
this repo. See `SECURITY.md` before sharing project archives.

## Problem statement

Marketing teams often plan in docs, ask AI tools for isolated copy, design in a
separate app, publish through platform dashboards, and analyze results in yet
another place. The handoffs are slow, context is lost, and the next campaign
does not reliably learn from the previous one.

## Solution

MarketingOS AI turns that fragmented workflow into one campaign operating
system. A user enters business details and a campaign goal, then specialized AI
agents create brand analysis, competitor analysis, strategy, copy, creative
briefs, generated media records, publishing plans, analytics, and learning
insights. Every output is stored with the campaign so the flow is auditable and
judge-friendly.

## AI agent workflow

1. Enter business details.
2. Create a campaign brief.
3. Brand Analysis Agent maps positioning, audience, tone, proof, and risks.
4. Competitor Analysis Agent identifies competitors, gaps, and angles.
5. Campaign Strategy Agent builds funnel, platform strategy, calendar, and budget allocation.
6. Copywriting Agent drafts hooks, captions, ad copy, and landing page copy.
7. Creative Generation Agent creates image and video prompts.
8. Hugging Face generates images when configured.
9. Kling generates videos when configured.
10. Publishing Agent creates the launch plan and approval checklist.
11. Analytics Agent reviews synced or mock analytics.
12. Learning Agent turns results into recommendations for the next campaign.

## Demo mode

Set this in `.env` for hackathon judging:

```bash
NEXT_PUBLIC_DEMO_MODE=true
```

Demo mode keeps the app stable and credit-safe:

- Agent outputs are generated from schema-valid demo data instead of calling paid text providers.
- Image and video generation creates demo asset records instead of calling Hugging Face or Kling.
- Analytics can use mock/demo data when real platform APIs are not connected.
- The campaign detail page still shows the full pipeline, so judges can inspect the end-to-end product.

Turn demo mode off only when you intentionally want live provider calls:

```bash
NEXT_PUBLIC_DEMO_MODE=false
```

## Local setup

1. Copy `.env.example` to `.env`.
2. Use the local Docker database URL:

```bash
DATABASE_URL="postgresql://marketingos:marketingos@localhost:5432/marketingos?schema=public"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_DEMO_MODE=true
```

3. Start local services:

```bash
docker compose up -d
```

4. Install and prepare the app:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

## Docker setup

`docker-compose.yml` starts PostgreSQL 16 and Redis locally. Use Docker for
normal development so Aurora is not running while you iterate.

Useful commands:

```bash
docker compose up -d
docker compose ps
docker compose down
```

Use `docker compose down -v` only when you intentionally want to delete local
database volumes.

## Prisma migration commands

Local development:

```bash
npm run db:generate
npm run db:migrate
```

Production or Aurora demo deployment:

```bash
npm run db:deploy
```

Run migrations once per demo database. Avoid repeated seed or migration loops
against Aurora because they waste time and can create confusing demo state.

## Aurora setup for demo

MarketingOS AI works with local PostgreSQL and Aurora PostgreSQL through the
same Prisma client. For an Aurora judge demo, change `DATABASE_URL` to your
Aurora PostgreSQL connection string in the deployment environment.

When connecting to Aurora over TLS from local Windows or a deployment image that
does not trust the RDS issuer, keep `sslmode=require` in `DATABASE_URL` and set
`PGSSLROOTCERT` or `DATABASE_CA_CERT_PATH` to the downloaded AWS RDS CA bundle
path. Do not use `sslmode=no-verify` except for throwaway troubleshooting.

Required environment variables:

```bash
DATABASE_URL=""
DIRECT_URL=""
PGSSLROOTCERT=""
DATABASE_CA_CERT_PATH=""
AUTH_SECRET=""
AUTH_URL=""
NEXTAUTH_SECRET=""
NEXTAUTH_URL=""
OPENROUTER_API_KEY=""
HUGGINGFACE_API_KEY=""
HF_TOKEN=""
KLING_API_KEY=""
REDIS_URL=""
AWS_REGION=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
NEXT_PUBLIC_DEMO_MODE="true"
```

`DIRECT_URL` is documented for teams that use a pooled `DATABASE_URL` and a
direct migration URL. This repo currently reads `DATABASE_URL` through
`prisma.config.ts`, so keep `DATABASE_URL` pointed at the connection Prisma
should actually use.

### Using Aurora only for demo without wasting AWS credits

- Use local Docker PostgreSQL while developing.
- Create or start Aurora only shortly before final demo testing.
- Prefer the smallest viable Aurora configuration for the showcase.
- Run migrations once with `npm run db:deploy`.
- Do not run unnecessary seed loops against Aurora.
- Keep `NEXT_PUBLIC_DEMO_MODE=true` unless you intentionally need live AI/media calls.
- Stop, pause, or delete unused AWS resources after the demo if they are not needed.
- Prefer IAM roles in production instead of long-lived AWS access keys where possible.

## v0 UI workflow

v0-generated components can be added safely if they stay modular and connected
to the existing data/actions:

- Place reusable UI in `components/*` and page-specific composition inside `app/*`.
- Use the existing `components/ui` primitives before adding new design-system code.
- Keep server actions in `actions/*`; do not replace working business logic with static UI.
- Use the current route params and workspace/campaign IDs when wiring buttons and forms.
- Keep Tailwind classes consistent with the dark SaaS theme in `app/globals.css`.
- Verify generated components with `npm run typecheck` before demo.

Best redesign targets for v0:

- Public home page sections and visuals.
- Workspace dashboard cards, empty states, and quick actions.
- Campaign wizard step layout.
- Campaign detail pipeline tabs/cards.
- Loading and empty states for analytics, assets, and agent runs.

## Hackathon presentation script

1. Open the public home page and explain: "Your AI-powered marketing team in one dashboard."
2. Sign in or register, then open a workspace.
3. Create a campaign with objective, offer, budget, audience, dates, and platforms.
4. Open the campaign detail page and click **Run workflow**.
5. Run the full pipeline and show each agent output stored in the campaign.
6. Show image/video asset records. In demo mode, explain that paid media calls are intentionally disabled to protect credits.
7. Click **Analyze results** to create mock-backed analytics.
8. Click **Update learning** and show recommendations for the next campaign.
9. Close by explaining Docker for local development and Aurora only for the final showcase.

## Local development

1. Copy `.env.example` to `.env`.
2. Set at least `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and `CRON_SECRET`.
3. Start PostgreSQL:

```bash
docker compose up -d
```

4. Install dependencies and prepare Prisma:

```bash
npm install
npm run db:generate
npm run db:migrate -- --name init
```

5. Start the app:

```bash
npm run dev
```

## Working / implemented features

These are present in the codebase and passed lint/type/build checks on June 27, 2026.

| Area | Status | Details |
| --- | --- | --- |
| Landing page | Implemented | Public home page with login/register calls to action. |
| User registration | Implemented | Creates a user, hashes the password, creates a workspace, and assigns the user as workspace owner. |
| Authentication | Implemented | Credentials login is configured; Google OAuth appears only when Google env vars are set. |
| Workspace access control | Implemented | Server-side membership and role checks are used across dashboard routes and actions. |
| Dashboard overview | Implemented | Shows recent campaigns, approval count, scheduled post count, and next action prompts. |
| Production SaaS UI shell | Implemented | Tokenized dark theme, redesigned sidebar/topbar, mobile bottom navigation, route progress indicator, and loading skeletons. |
| Toast notifications | Implemented | Centralized `react-hot-toast` helper for success/error/loading/promise notifications. |
| Brand profile | Implemented | Brand profile form and persistence are wired through server actions. |
| Campaign creation | Implemented | Campaign wizard creates campaigns with goal, budget, dates, platforms, audience, offer, and notes. |
| AI campaign generation | Implemented | Main generation flow now runs business analysis, competitor analysis, strategy, copywriting, brand safety, creative prompts, image generation, optional Kling video, AI jobs, usage tracking, and review handoff. |
| AI fallback behavior | Implemented | Agent outputs are Zod-validated and have fallback content so provider failures degrade into reviewable drafts. |
| Post review / approvals | Implemented | Generated posts can be approved, rejected, or sent back with feedback. |
| Scheduling | Implemented | Only approved posts can be scheduled; scheduled records update post status. |
| Cron publishing | Implemented | `/api/cron/publish-scheduled` publishes due scheduled posts when authorized with `CRON_SECRET`. |
| Social OAuth | Implemented for selected providers | Instagram, Facebook, LinkedIn, and X connect/callback routes exist. Unsupported platforms are shown as coming soon. |
| Publishing providers | Implemented for supported providers | Meta, LinkedIn, and X publishing are wired, including generated image attachment flows where provider credentials/scopes allow. |
| Analytics sync | Implemented for supported providers | Cron endpoint syncs published post metrics and Meta campaign insights where provider credentials/account data exist. |
| Analytics dashboard | Implemented | Displays spend, reach, impressions, clicks, engagement chart, platform breakdown, recommendations, and learned insights from past campaigns. |
| Meta campaign actions | Implemented | Server actions exist for creating, launching, pausing, resuming, and deleting Meta campaign bundles. |
| Ad image generation | Implemented | Approved posts can generate ad preview images through Hugging Face when `HF_TOKEN` and S3 are configured, with Pollinations.AI as a public fallback. |
| Instagram ad launch | Implemented as paused launch flow | Approved posts with an image can create a paused Meta campaign, ad set, creative, and ad through Graph API v20.0. |
| Billing webhook | Skeleton implemented | Stripe webhook route and subscription mapping exist; full billing UI/checkout flow appears limited. |
| Upload/storage | Implemented hooks/routes | Upload route and S3 helpers exist; correct AWS env vars are required for persisted generated assets. |

## Current errors and limitations

| Item | Status | Details |
| --- | --- | --- |
| Next docs requested by AGENTS.md | Missing locally | AGENTS.md says to read `node_modules/next/dist/docs/` before code changes, but this installed Next package does not include that folder. |
| Image/video generation in main campaign flow | Implemented | Campaign generation attaches generated image URLs when `AI_GENERATE_MEDIA` is enabled and creates optional Kling video assets when the campaign opts in. |
| Instagram publishing | Guarded | Instagram approval/publishing requires a public image URL and surfaces a clear error when media is missing. |
| LinkedIn media publishing | Implemented as best-effort | LinkedIn image upload is wired through the registered image upload flow before post creation. |
| X media publishing | Implemented as best-effort | X media upload is wired before tweet creation for generated media URLs. |
| TikTok, YouTube, Pinterest publishing | Coming soon | Unsupported platforms are centralized in `config/platforms.ts`, shown as coming soon, and blocked during campaign creation. |
| Provider features need real credentials | Environment-dependent | Social OAuth, publishing, analytics, AI generation, S3 uploads, Stripe, and cron jobs require valid provider credentials and approved scopes. Rotate any credential that may have been exposed locally. |
| Meta ad publishing permission | Environment-dependent | Meta ads require `ads_management`, `ads_read`, and `business_management` scopes plus App Review approval; development access is limited to app developers/testers. |
| Prisma migrate dev | Blocked by existing DB drift | `prisma migrate dev` detected drift in the local database and requested a reset, so only the additive ad-fields SQL was applied with `prisma db execute`. |
| Workspace team administration | Implemented | Admins/owners can add registered users, update roles, and remove members with last-owner safeguards and audit logs. |
| Settings page wiring | Implemented | General settings save through a server action; provider secrets are shown only as configured/not configured and never rendered. |
| No automated test suite | Missing | The project has lint and typecheck scripts, but no unit/integration/e2e test scripts are currently defined. |

## Verification run

Commands run in this workspace:

```bash
npm run lint
npm run typecheck
npm run build
npm run db:generate
npx prisma format
npx prisma db execute --file prisma/migrations/20260626103000_add_ad_fields_to_generated_post/migration.sql
```

Results:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run db:generate` passed.
- `npx prisma format` passed.
- The additive ad-fields SQL migration executed successfully with `prisma db execute`.

## Production notes

- Use PostgreSQL locally through Docker or a managed PostgreSQL database in production.
- Run `npm run db:deploy` as the production migration command.
- Configure AI, S3, social OAuth, Auth.js, Stripe, and `CRON_SECRET` variables in the deployment environment.
- The Vercel cron jobs are configured in `vercel.json` for scheduled publishing and analytics sync.

## MarketingOS AI multi-agent workflow

MarketingOS now includes a resumable agency-style campaign pipeline:

Business brief -> Brand Analysis -> Competitor Analysis -> Campaign Strategy -> Copywriting -> Creative Brief -> Hugging Face image -> Kling video -> Publishing Plan -> Analytics -> Learning.

Key implementation files:

- `prisma/schema.prisma` defines `CampaignPlatform`, `AgentRun`, `BrandAnalysis`, `CompetitorAnalysis`, `CampaignStrategy`, `CampaignCopy`, `CreativeBrief`, `GeneratedAsset`, `PublishingPlan`, and `LearningInsight`.
- `lib/ai/providers/callAI.ts` routes text generation through Groq, then Gemini, then Mistral with retryable JSON parsing helpers.
- `lib/ai/marketing-os/prompts/*` stores one system prompt per agent.
- `lib/ai/marketing-os/pipeline.ts` runs and resumes the full workflow, storing every agent input/output in `AgentRun`.
- `lib/ai/marketing-os/huggingface.ts` and `lib/ai/marketing-os/kling.ts` persist generated assets.
- `actions/marketing-os.ts` exposes server actions for pipeline, analytics, and learning runs.
- `app/(dashboard)/[workspaceSlug]/campaigns/[id]/run/page.tsx` is the run console.

The pipeline is database-backed today and Docker includes Redis so it can move to a worker queue without changing the product flow. Local development uses Docker PostgreSQL; production can use Aurora PostgreSQL by replacing `DATABASE_URL`.

### Hackathon demo script

1. Open a workspace and create a campaign at `/{workspaceSlug}/campaigns/new` with objective, offer, budget, dates, audience, notes, and platforms.
2. Open the campaign detail page and click **Run workflow**.
3. On the run console, click **Run full pipeline** and show each `AgentRun` being stored with model, status, input, output, and errors if a provider fails.
4. Return to the campaign detail page and show the brief, brand analysis, competitor analysis, strategy, copy, creative brief, generated image/video asset records, and publishing plan.
5. Click **Analyze results** to create mock analytics when real platform analytics are not connected.
6. Click **Update learning** to turn campaign results into future recommendations.
