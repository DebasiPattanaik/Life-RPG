# Rekindle

Rekindle is a countryside cottage life RPG that turns daily routines and self-care habits into a mindful journey through an interactive autumn cottage.

## Problem

Habit trackers feel like chores, so people stop using them. This app turns daily self-care and productivity into a cozy quest loop, with an interactive world and a companion that reacts to your progress, so the routine feels worth returning to.

## Stack

- Next.js 15 + React 19
- Tailwind CSS
- Supabase Auth, Postgres, and Row Level Security
- Web Audio API for procedural ambient sound
- 360° panorama embed (PanoramaGenerator)

## Features

- Whimsical Studio Ghibli-style cottage landing page with wind particles and ambient audio
- Guest Adventurer demo mode (no account required)
- Email/password authentication via Supabase
- 360° interactive cottage with four explorable rooms
- Autonomous Shibu companion that reacts to completed tasks
- Daily quest board with a 20-task pool, max 5 active at a time
- XP and leveling system with real-time progress
- Audio feedback for task completion, navigation, and rewards

## Supabase + Vercel Setup

1. Install dependencies.

```bash
npm run install:all
```

Or directly inside `frontend`:

```bash
cd frontend
npm install
```

2. Create a Supabase project.

- Go to https://supabase.com
- Create a new project
- Save the project URL and anon key

3. Create the database schema.

- Open `backend/migrations/20260912_rpg_backend_v2_1.sql`
- Paste it into the Supabase SQL editor and run it
- This creates all `rpg_*` tables, Row Level Security policies, and RPC functions:
  - `rpg_complete_task(p_task_id, p_idempotency_key)`
  - `rpg_claim_daily_bonus()` / weekly / monthly / yearly bonus RPCs
  - `rpg_purchase_reward(p_reward_id)`
  - `rpg_equip_reward(p_reward_id)`
  - `rpg_get_profile_summary()` / `rpg_get_shop_state()`
- To roll back, run `backend/migrations/20260912_rpg_backend_v2_1_down.sql`

4. Configure the frontend.

For local development only, create `frontend/.env.local`. For a hosted deployment, add the same variables in your hosting provider (for example Vercel) instead of relying on a local server.

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
```

The application now reads RPG state exclusively from Supabase `rpg_*` tables/RPCs when configured. The old `public.profiles`, `public.quests`, and `public.inventory` paths are no longer used.

5. Deploy the frontend.

- Push this repository to GitHub.
- Import the repository into Vercel (or another Next.js host).
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the hosting project's Environment Variables for Production, Preview, and Development as appropriate.
- Redeploy after saving the variables.
- In Supabase Authentication → URL Configuration, set the Site URL to your deployed frontend URL and add the deployed `/auth` and `/cottage` URLs to Redirect URLs.
- If Google login is enabled, configure the Google provider in Supabase and use Supabase's generated callback URL in Google Cloud.

6. Local development (optional).

```bash
npm run install:all
npm run dev
```

Local development is only a development convenience; production RPG persistence and authentication are Supabase-backed.

## Deployment to Git

1. Initialize git (if not already initialized).

```bash
git init
```

2. Stage and commit all project files.

```bash
git add .
git commit -m "feat: Rekindle - Ghibli cottage 360 panorama life RPG"
```

3. Rename the main branch and push.

```bash
git branch -M main
git remote add origin https://github.com/your-username/rekindle.git
git push -u origin main
```

Prefer incremental commits? Stage `backend/`, then `frontend/`, then the remaining docs and config, each as its own commit.

## Database Model

- `rpg_*` tables store player state, task completions, and rewards, all under Row Level Security.
- `backend/API_REFERENCE.md` documents the RPC function signatures and contracts.
- Migrations are additive and reversible via the matching `_down.sql` file.

## Repo Scripts

- `npm run dev` - start the frontend development server
- `npm run install:all` - install dependencies for the whole project
- `npm run build` - production build (run inside `frontend`)

## Notes

- Guest Adventurer mode is intentionally offline and uses browser storage; authenticated production users use Supabase.
- Keep the 360° panorama embed URL and illustration assets under `frontend/public/themes/`.
- Supabase RLS policies gate all `rpg_*` tables per authenticated user.
- Never put a Supabase `service_role` key in the frontend. Only the publishable/anon key belongs in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## License

MIT © Rekindle Contributors. Illustrations inspired by Studio Ghibli aesthetics. 360° panorama powered by PanoramaGenerator.


## Persistent player data
Run `backend/migrations/20260912_rpg_backend_v2_1.sql` followed by `backend/migrations/20260913_auth_persistence.sql`. Authenticated RPG state is stored server-side and linked to `auth.users.id`.
