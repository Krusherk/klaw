# Klaw Field

Klaw Field is a Next.js + Supabase app for story submissions and admin-led task moderation.

## Core Flow

1. Users register/login with email + password.
2. User sets one immutable X username.
3. User submits one story per UTC day with Solana wallet + country.
4. Admin assigns one active task (story becomes `pending`).
5. User submits X proof URL.
6. Admin approves/rejects, and can reopen rejected stories.

## Statuses

- `normal`
- `pending`
- `approved`
- `rejected`

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Supabase Auth + Postgres
- Vitest

## Environment

Copy `.env.example` to `.env.local` and fill values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS` (comma-separated)

## Database

Run migration SQL from:

- `supabase/migrations/0001_initial.sql`

This migration includes enums, tables, indexes, RLS policies, and public feed view.

## Local Dev

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`

## API Surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/profile/x-username`
- `POST /api/stories`
- `GET /api/stories`
- `GET /api/stories/mine`
- `POST /api/stories/{storyId}/proof`
- `GET /api/admin/stories`
- `GET /api/admin/stories/{storyId}`
- `POST /api/admin/stories/{storyId}/assign-task`
- `POST /api/admin/stories/{storyId}/approve`
- `POST /api/admin/stories/{storyId}/reject`
- `POST /api/admin/stories/{storyId}/reopen`

## Notes

- Wallet and country remain admin-only in API/UI exposure.
- Proof links are visible to owner and admin screens only.
- Story feed defaults to oldest-first order.
