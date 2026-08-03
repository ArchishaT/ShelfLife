# ShelfLife

A calmer way to keep track of what's in the medicine cabinet — expiry dates,
dosage, quantity, and gentle reminders before anything goes out of date.

Built with TanStack Start, React, TypeScript, Tailwind CSS, and Supabase.

## Getting started

```sh
npm i
cp .env.example .env   # then fill in your own Supabase project values, see below
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment variables

Copy `.env.example` to `.env` and fill in the values from your own Supabase
project (Project Settings → API):

```
SUPABASE_PROJECT_ID=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

- The `VITE_`-prefixed vars are exposed to the browser bundle — use the
  public **anon/publishable** key here, never a service role key.
- The non-`VITE_` vars are read server-side (SSR loaders, server functions).
- If you need admin/service-role access from a server function, add
  `SUPABASE_SERVICE_ROLE_KEY` to `.env` as well and keep it out of any
  `VITE_`-prefixed variable — see `src/integrations/supabase/client.server.ts`.

`.env` is gitignored — never commit real keys.

## Database

SQL migrations live in `supabase/migrations`. Apply them with the Supabase
CLI:

```sh
supabase link --project-ref <your-project-ref>
supabase db push
```

## Adding Google OAuth

Google sign-in is wired up in `src/routes/auth.tsx` via
`supabase.auth.signInWithOAuth({ provider: "google" })`, but it won't do
anything until you enable the provider on the Supabase side:

1. In the Supabase dashboard: **Authentication → Providers → Google** → toggle
   it on.
2. In the [Google Cloud Console](https://console.cloud.google.com/), create an
   OAuth 2.0 Client ID (type: Web application) and add your Supabase project's
   callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`) as an
   authorized redirect URI.
3. Paste the resulting Client ID and Client Secret into the Supabase provider
   settings and save.
4. Add your local dev URL (e.g. `http://localhost:5173`) and your production
   URL to **Authentication → URL Configuration → Redirect URLs** in Supabase.

Apple and Microsoft sign-in can be added the same way — enable the provider in
Supabase, register the app with that provider, and call
`supabase.auth.signInWithOAuth({ provider: "apple" | "azure" })`.

## Project structure

```
src/
  components/       Reusable UI (shadcn/ui-based + app-specific)
  hooks/             Data + auth hooks
  integrations/
    supabase/        Supabase client (browser + server) and auth middleware
  lib/               Utilities, theme, error reporting
  routes/            File-based routes (TanStack Router)
supabase/
  migrations/        SQL schema + RLS policies
```

## Tech stack

- TanStack Start + TanStack Router
- TypeScript
- React 19
- Tailwind CSS
- Supabase (Postgres, Auth, Storage)
- React Hook Form + Zod
