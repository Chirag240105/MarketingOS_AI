# 🚀 MarketingOS AI

> The all-in-one AI-powered marketing operating system — plan, create, publish, and analyze your entire marketing strategy from a single platform.

![MarketingOS AI Banner](https://via.placeholder.com/1200x400/6366f1/ffffff?text=MarketingOS+AI)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![AWS Aurora](https://img.shields.io/badge/AWS-Aurora%20PostgreSQL-orange?logo=amazon-aws)](https://aws.amazon.com/rds/aurora/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## ✨ Features

- **AI Content Generation** — Generate blog posts, social captions, ad copy, and email sequences in seconds
- **Video Reel Generation** — Create short-form video content via Hugging Face + Kling API (dual pipeline)
- **Image Pipeline** — AI image generation with HF-first, Kling fallback architecture
- **Campaign Planner** — Map out full marketing campaigns with AI-suggested timelines and budgets
- **Multi-Channel Publishing** — Schedule and publish across social, email, and web from one place
- **Analytics Dashboard** — Track performance metrics and get AI-powered optimization suggestions
- **Aurora PostgreSQL Backend** — Scalable, serverless-ready database via AWS Aurora

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | AWS Aurora PostgreSQL |
| ORM | Prisma |
| AI — Text | Anthropic Claude API |
| AI — Video | Hugging Face Inference API + Kling API |
| AI — Images | Hugging Face Inference API + Kling API |
| Auth | NextAuth.js |
| Styling | Tailwind CSS |
| Deployment | Vercel / AWS |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│                                                                     │
│   ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│   │  Dashboard  │  │  Campaign    │  │  Video Reel            │   │
│   │  /analytics │  │  Planner     │  │  Generator             │   │
│   └──────┬──────┘  └──────┬───────┘  └───────────┬────────────┘   │
└──────────┼────────────────┼──────────────────────┼────────────────┘
           │                │                      │
           ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APP ROUTER (Server)                     │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                       API Routes                             │ │
│   │                                                              │ │
│   │  /api/ai/content   /api/ai/image   /api/ai/video            │ │
│   │        │                 │               │                   │ │
│   │        ▼                 ▼               ▼                   │ │
│   │  ┌──────────┐   ┌──────────────┐  ┌──────────────────────┐  │ │
│   │  │  Claude  │   │  HF Images   │  │  Video Pipeline      │  │ │
│   │  │  API     │   │  → Kling     │  │  HF → Kling fallback │  │ │
│   │  │ (Text)   │   │  (fallback)  │  │  (task polling)      │  │ │
│   │  └──────────┘   └──────────────┘  └──────────────────────┘  │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                      lib/ Services                           │ │
│   │   db.ts │ hf-video-service.ts │ kling-video-service.ts      │ │
│   └──────────────────────────────┬───────────────────────────────┘ │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
           ┌───────────────────────┼────────────────────────┐
           ▼                       ▼                        ▼
┌─────────────────┐   ┌────────────────────────┐  ┌────────────────┐
│  AWS Aurora     │   │  Hugging Face          │  │  Kling API     │
│  PostgreSQL     │   │  Inference API         │  │  (Paid video   │
│                 │   │  (text-to-video,       │  │   fallback)    │
│  - Users        │   │   img gen)             │  │                │
│  - Campaigns    │   │                        │  │  Task polling  │
│  - Content      │   │  HF_TOKEN auth         │  │  async result  │
│  - Analytics    │   └────────────────────────┘  └────────────────┘
│                 │
│  SSL required   │
│  RDS Proxy      │
│  (prod)         │
└─────────────────┘
```

### AI Pipeline Decision Flow

```
User Request
     │
     ├──▶ Text/Copy ──────────────────▶ Anthropic Claude API
     │
     ├──▶ Image ──▶ HF_TOKEN set? ──Yes──▶ Hugging Face ──▶ ✅
     │                   │ No                                │ Fail
     │                   └──────────────────────────────────▶ Kling API ──▶ ✅
     │
     └──▶ Video ──▶ HF_TOKEN set? ──Yes──▶ Hugging Face ──▶ ✅
                        │ No                                │ Fail
                        └──────────────────────────────────▶ Kling API
                                                               │
                                                          Poll for task
                                                               │
                                                              ✅
```

### Data Flow

```
Browser ──▶ Next.js API Route ──▶ AI Service (HF / Kling / Claude)
                  │                          │
                  │◀─────── AI Response ─────┘
                  │
                  ▼
           Prisma ORM ──▶ AWS Aurora PostgreSQL
                  │              │
                  │◀── Stored ───┘
                  │
                  ▼
           Return to Client
```

---

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS Aurora PostgreSQL instance (with SSL enabled)
- API keys: Anthropic, Hugging Face, Kling (optional fallback)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/marketingOSai.git
cd marketingOSai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Database
DATABASE_URL=postgresql://user:password@your-aurora-cluster.cluster-xxxx.us-east-1.rds.amazonaws.com:5432/marketingos?sslmode=require

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Hugging Face
HF_TOKEN=hf_...

# Kling (optional fallback)
KLING_API_KEY=...
KLING_API_SECRET=...

# Auth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🗂 Project Structure

```
marketingOSai/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── video/         # Dual HF + Kling video pipeline
│   │   │   ├── image/         # HF-first image generation
│   │   │   └── content/       # Text generation via Claude
│   │   └── db-test/           # DB connection health check
│   ├── dashboard/
│   ├── campaigns/
│   └── analytics/
├── components/
│   ├── video-reel-generation.tsx
│   └── ...
├── lib/
│   ├── db.ts                  # Aurora PostgreSQL client
│   ├── kling-video-service.ts # Kling API integration
│   ├── hf-video-service.ts    # Hugging Face video integration
│   └── ...
├── prisma/
│   └── schema.prisma
└── .env.example
```

---

## 🎬 Video Generation Architecture

MarketingOS AI uses a dual-pipeline approach for video generation:

```
Request
  │
  ▼
HF_TOKEN set? ──Yes──▶ Hugging Face Inference API
  │                         │
  No                    Success? ──Yes──▶ Return video
  │                         │
  │                         No
  ▼                         ▼
Kling API ◀────────────────────
  │
  ▼
Task polling → Return video
```

This ensures you get free/low-cost generation via Hugging Face whenever possible, with Kling as a reliable paid fallback.

---

## 🔐 AWS Aurora PostgreSQL Setup

Key configuration for Aurora (serverless-friendly):

- SSL is **required** — add `?sslmode=require` to your `DATABASE_URL`
- Use connection pooling (PgBouncer or RDS Proxy) in production
- Ensure your security group allows inbound on port **5432** from your app's IP or VPC
- For Vercel deployments, consider AWS RDS Proxy to handle connection limits

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [Your Name](https://github.com/yourusername)

---

## 🙋 Support

Open an issue or reach out at **hello@marketingos.ai**
