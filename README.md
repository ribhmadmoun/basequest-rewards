# BaseQuest Rewards

Daily rewards and engagement mini app for the Base ecosystem.

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- OnchainKit + wagmi
- Supabase

## Prerequisites

- Node.js 20+
- npm
- A Supabase project
- An OnchainKit API key

## Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Fill in `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | Coinbase Developer Platform OnchainKit key |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. `https://your-app.vercel.app`) |

4. Create the Supabase tables.

**`users` table:**

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  total_xp integer not null default 0,
  streak integer not null default 0,
  last_checkin date,
  completed_quests jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**`quests` table:**

```sql
create table quests (
  id text primary key,
  title text not null,
  description text not null,
  reward_xp integer not null default 0,
  status text not null default 'active',
  display_order integer not null default 0,
  enabled boolean not null default true
);
```

5. Configure Supabase Row Level Security before production. At minimum:

- Allow public read on `quests` where `enabled = true`
- Allow authenticated/anon read on `users` for leaderboard/profile
- Restrict `users` inserts/updates to the connected wallet row

6. Seed quest data (optional if using Supabase quest catalog):

```sql
insert into quests (id, title, description, reward_xp, status, display_order, enabled)
values
  ('daily-check-in', 'Daily Check-in', 'Check in once per day to earn rewards and keep your streak alive.', 10, 'active', 1, true),
  ('view-leaderboard', 'View Leaderboard', 'Open the leaderboard for the first time.', 25, 'active', 2, true),
  ('build-streak', 'Build Your Streak', 'Return daily to grow your streak and unlock bonus engagement rewards.', 5, 'active', 3, true),
  ('explore-base', 'Explore Base Apps', 'Discover popular apps in the Base ecosystem and earn bonus XP.', 15, 'active', 4, true);
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add the environment variables from `.env.example` in the Vercel project settings.
4. Deploy.

## Base Mini App / Farcaster manifest

Before submitting as a Base Mini App, update `public/.well-known/farcaster.json`:

1. Replace `YOUR_PRODUCTION_DOMAIN` with your live HTTPS domain (same value as `NEXT_PUBLIC_APP_URL`).
2. Replace `app-icon.png` with your hosted icon path if different.
3. Add a production icon asset under `public/` (recommended: square PNG, at least 512x512).

**TODO before production:** set `homeUrl` and `iconUrl` in `public/.well-known/farcaster.json` to your deployed domain.

For local Mini App testing only, you may temporarily use `http://localhost:3000` — do not ship that to production.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard — quests, wallet, progress |
| `/leaderboard` | Top 50 users by XP |
| `/profile` | Connected wallet profile, badges, stats |

## Local storage

Progress is stored per wallet in the browser using keys scoped to the connected wallet address. Guest progress uses a separate key when no wallet is connected.
