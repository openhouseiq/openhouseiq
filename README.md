# OpenHouseIQ

A tool for real estate agents to manage listings, generate a QR code for
each open house, and collect visitor feedback and offers on the spot.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling (brand colors/fonts in `src/app/globals.css`)
- [Supabase](https://supabase.com) for auth, database, and file storage

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase project's
   URL and publishable/anon key (Supabase dashboard → Project Settings → API Keys).
3. In the Supabase SQL Editor, run each file in `supabase/` **in order**
   (0001, 0002, 0003, ...) — each one is a one-time migration that sets up
   tables, storage, and security rules. See `supabase/README.md` for what
   each one does.
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `src/app/(login|signup|forgot-password|reset-password)` — public auth pages
- `src/app/dashboard` — agent-only pages (listings, settings) — requires login
- `src/app/visit/[id]` — public pages a visitor sees after scanning a listing's QR code
- `src/lib/supabase` — Supabase client setup (browser, server, and session-refresh middleware)
- `src/proxy.ts` — route protection (redirects between login/dashboard based on auth state)
- `supabase/` — SQL migrations, run manually in the Supabase SQL Editor

## Deployment

When ready to deploy (e.g. to [Vercel](https://vercel.com/new)), set the same
two environment variables from `.env.local` in your hosting provider's
dashboard, and add your production domain's `/reset-password` URL to
Supabase's Authentication → URL Configuration → Redirect URLs.
