# KhethAi - Smart Farming, Better Harvest

AI-powered crop disease diagnosis PWA for Indian farmers. Built offline-first for low-spec devices on 3G networks.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Offline**: Service Worker + IndexedDB (via `idb`)
- **AI** (planned): TensorFlow.js (on-device) + AWS SageMaker (cloud)
- **Backend** (planned): AWS Lambda + DynamoDB + S3

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with i18n + PWA providers
│   ├── page.tsx             # Entry point - redirects to login/dashboard
│   ├── login/page.tsx       # Phone OTP authentication flow
│   ├── dashboard/page.tsx   # Main dashboard with feature cards
│   ├── offline/page.tsx     # Offline fallback page
│   └── globals.css          # Tailwind base + village-ready utilities
├── components/
│   ├── ui/
│   │   ├── Button.tsx       # Accessible button (48px+ touch targets)
│   │   ├── Input.tsx        # Form input with labels/errors
│   │   └── Card.tsx         # Feature card (div or button)
│   ├── LanguageSwitcher.tsx # Language dropdown (EN/HI/TE)
│   ├── OfflineIndicator.tsx # Network status banner
│   └── ServiceWorkerRegistrar.tsx
├── lib/
│   ├── i18n/
│   │   ├── context.tsx      # React context for translations
│   │   └── translations/    # en.ts, hi.ts, te.ts
│   └── db.ts                # IndexedDB wrapper (cache, sync queue)
public/
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker (cache-first strategy)
└── icons/                   # App icons
```

## Design Principles

- **Village-Ready UI**: 48px+ touch targets, 4.5:1 contrast, icon-heavy
- **Offline-First**: All core features work without internet
- **3G Optimized**: <94KB first-load JS per page
- **i18n**: English, Hindi, Telugu (extensible to 8 languages)

## Deploy (free)

The app works on **Vercel**, **Netlify**, or any Node host. For **OTP login to work** on serverless (different instances per request), use **Upstash Redis** (free tier):

1. Sign up at [upstash.com](https://upstash.com) and create a Redis database.
2. Copy **REST URL** and **REST Token** from the database dashboard.
3. In your deployment project (e.g. Vercel → Settings → Environment Variables), add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Deploy. OTP is stored in Redis so send and verify work across instances.

Without these env vars, the app falls back to in-memory OTP (fine for local dev; unreliable after deploy). Set your other env vars (AWS, OpenWeather, Groq, DATA_GOV_IN_API_KEY) in the same place for weather, mandi, and AI features.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
