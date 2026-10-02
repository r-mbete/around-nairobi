# Around Nairobi backend

A small Next.js app that does two jobs:

- **API for the phone app**: the event feed the app syncs from, and the endpoint organisers submit events to.
- **Moderation screen** at `/admin`: approve, edit or reject submissions, and edit, cancel or unpublish listed events.

It uses Next.js 16, Postgres with Drizzle ORM, and zod for validation.

## Run it locally

```bash
cd backend
npm install
cp .env.example .env.local   # then set ADMIN_PASSWORD and SESSION_SECRET
npm run setup                # create the tables and add sample data
npm run dev                  # http://localhost:3000/admin
```

With no `DATABASE_URL` set, the database is **PGlite**: real Postgres running inside Node, stored in `backend/.pglite/`. You don't need to install anything. Only one process can open it at a time, so stop `npm run dev` before running `npm run db:seed` again.

To use Docker instead, run `docker compose up -d` and set `DATABASE_URL` from `.env.example`. A hosted database (Supabase, Neon) works the same way.

### Point the phone app at it

In the project root (not `backend/`), create `.env.local` with:

```bash
# Phone on the same Wi-Fi: use your computer's address, not localhost.
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
```

Find the address with `hostname -I` on Linux or `ipconfig getifaddr en0` on macOS. Restart Expo with `npx expo start -c`. Without this variable, the app uses its built-in fake server.

Start the backend with `npm run dev -- -H 0.0.0.0` so other devices on your network can reach it.

## API

| Endpoint | What it does |
|---|---|
| `GET /api/events` | Full sync: every published or cancelled event that hasn't been over for more than a week, plus their venues. |
| `GET /api/events?updatedSince=<ISO>` | Delta: every event or venue changed since then. This includes events set back to pending, so phones remove them. |
| `POST /api/submissions` | Stores a submission as pending. Returns `201` the first time and `200` if the same `id` arrives again. Validation errors return `422` with errors per field. |

Responses use the app's types: `{ serverTime, events, venues }`. The `serverTime` cursor is 30 seconds behind the clock, so an edit saved during a sync isn't missed. The app ignores the occasional repeated row. Organiser contact details are stored only in `submissions` and never appear in the feed.

A full week of sample data is about 6 KB uncompressed, well under the 150 KB target.

## Moderation

Sign in at `/admin/login` with `ADMIN_PASSWORD`. The dashboard shows:

- **Waiting for review**, oldest first, with how long each has waited. It turns orange after 20 hours, so you can meet the 24-hour target.
- **Review**: the form is filled in from the submission. If the venue already exists, its address and coordinates are filled in too. Fix anything, set the organiser name and the map coordinates, then **Approve and publish**. Or **Reject** with a reason.
- **Listed events**: edit details, **Cancel** (stays in the app marked as cancelled, and people who saved it are told), **Publish again**, or **Unpublish** (removed from phones).

Phones see changes on their next sync.

## Commands

| Command | |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Tests (Vitest, against an in-memory Postgres with the real migrations) |
| `npm run typecheck` | Generates route types, then type-checks |
| `npm run lint` | ESLint |
| `npm run db:generate` | Creates a SQL migration after you change `db/schema.ts` |
| `npm run db:migrate` | Applies migrations |
| `npm run db:seed` | Adds sample data if the database is empty (`-- --reset` wipes it first) |

## Layout

```
app/api/        Route handlers for the phone app
app/admin/      Moderation pages, forms and Server Actions
db/             Schema, migrations, connection, migrate and seed scripts
lib/            Logic: feed, submissions, moderation, validation, admin session, Nairobi time
lib/__tests__/  Tests
```

## Before going live

- **Email for rejections.** Rejection reasons are saved and shown in the dashboard, but nothing emails the organiser yet. Contact them by hand, or add an email provider.
- **Admin login.** v1 uses one shared password. Give each moderator their own account before adding more people.
- **Rate limiting** on `POST /api/submissions`, to slow down spam.
- **HTTPS.** Release builds of the app won't call a plain `http://` address.
- **Organiser name.** The app's form doesn't ask for one, so the moderator types it in when approving. Consider adding the field to the app.
