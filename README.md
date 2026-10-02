# Around Nairobi

**What's happening in the city this week?**

Around Nairobi is a mobile app that lists the week's events in Nairobi: gigs, markets, exhibitions, talks, sport and community meetups, browsable by day and by neighbourhood.

It is built to work offline. Many people in Nairobi browse on a patchy connection or run out of bundles mid-week, so the week's listings download once and keep working with no data at all.

> **Status:** the v1 app and its backend work end to end locally: the app syncs from the backend, organisers submit events, and a moderator approves them at `/admin`. Nothing is deployed yet.

## Features

- **This week**: events for today and the next 6 days, grouped by day, with time, venue, neighbourhood, category and price
- **Filters and search**: filter by category, neighbourhood and free events, and search titles, venues and organisers. Filters are remembered between launches, and search works with no data.
- **Event detail**: full description, venue address, directions in Google Maps, sharing to WhatsApp, and a link to the organiser's page
- **Saved events and reminders**: save an event and get a notification before it starts (1 h, 2 h or the morning of). If a saved event changes or is cancelled, you're told and the card is marked.
- **Organiser submissions**: a form to submit an event for review. Anything submitted offline waits on the phone and sends by itself when the connection returns.
- **Offline-first**: the app always opens from the listings stored on the phone, downloads only what changed, shows when it last updated, and shows a clear banner when you're offline

Not in v1: ticket sales, user accounts, reviews, or cities other than Nairobi.

## Getting started

You need [Node.js](https://nodejs.org) (LTS) and the [Expo Go](https://expo.dev/go) app on your phone.

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Press `w` to open it in a browser instead.

If Expo Go can't connect:

- Make sure your phone and computer are on the same Wi-Fi network.
- If they are, run `npx expo start --tunnel`.
- If Expo Go asks you to sign in, run `npx expo login` with the same account you use in Expo Go.

After adding or updating packages, restart with `npx expo start -c` to clear the bundler cache.

### Trying the offline features

- **Offline:** turn on airplane mode. The app shows an offline banner and keeps working with the events already on the phone.
- **Queued submissions:** submit an event while offline. It appears under "Waiting to send", then sends by itself when you reconnect.
- **Reminders:** save an event that starts more than 2 hours from now. Reminders only work in the phone app. The web preview saves events but can't send notifications.

### Checks

Run all three before opening a pull request:

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npm test           # unit and component tests (npm run test:watch while working)
```

Tests use Jest with `jest-expo` and React Native Testing Library. They live in `__tests__/` folders next to the code they cover, never inside `src/app/`, because every file there becomes a screen. They cover the sync engine, the submission queue, reminders, filters and search, the form checks, the Nairobi time helpers, and the event card and Save panel.

## How it works

Screens never call the network. They read from data stored on the phone, and a sync engine keeps that data up to date whenever there's a connection.

- **Cache**: the week's events and venues are saved on the phone and read instantly at launch.
- **Sync**: the app asks the server only for events changed since the last sync. It syncs at launch, when the connection comes back, and when the app is reopened after 15 minutes. A failed sync retries after 30 s, 2 min, then 10 min. Pull down on the list to sync by hand.
- **Saved events, filters and queued submissions** are stored on the phone too, so they survive restarts.
- **Reminders** are local notifications scheduled on the phone. No push server is needed.

### Backend

The backend lives in [`backend/`](backend/README.md). It's a Next.js app with Postgres that serves the API and the moderation screen. To run the app against it:

1. Start the backend: `cd backend && npm install && cp .env.example .env.local`, set the admin password and secret, then `npm run setup && npm run dev -- -H 0.0.0.0`.
2. In the project root, copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL=http://<your computer's network address>:3000/api`.
3. Restart Expo with `npx expo start -c`.

Without `EXPO_PUBLIC_API_URL`, the app uses a fake server built into the app, so it still works without the backend. The fake server's sample week stays the same for 4 days, then refreshes.

The app needs two endpoints. Their contract is in [`src/lib/api.ts`](src/lib/api.ts), and [`backend/README.md`](backend/README.md) has the details:

| Endpoint | Purpose |
|---|---|
| `GET /events?updatedSince=<ISO time>` | Returns `{ serverTime, events, venues }` for everything changed since that time. Without `updatedSince`, returns everything currently listed. |
| `POST /submissions` | Stores a submitted event as pending for review. Sends an `Idempotency-Key` header so a retried submission isn't stored twice. |

## Project structure

```
src/
  app/
    (tabs)/      Tab screens: This week, Saved, Submit
    event/[id]   Event detail
    filters      Filter screen
  components/    Reusable UI, such as EventCard, Chip and SavePanel
  data/          Event types and date helpers, plus the cache, filters, saved events and submission queue
  hooks/         Small shared hooks (online state, current time)
  lib/           API client, fake server, sync engine, reminders, on-device storage
  theme/         Design tokens: colours, fonts, spacing
backend/         Next.js API and moderation screen (separate package, see backend/README.md)
```

Files ending in `.web.ts` replace their neighbour on web. The web preview uses the browser's storage and skips notifications.

Always install packages with `npx expo install <package>` rather than `npm install`, so versions match the Expo SDK.

## Design

The look is based on a riso-print travel poster: flat, saturated colour blocks on deep navy, chunky hand-cut lettering, and decorative borders of eyes and diamonds.

| Role | Font | Used for |
|---|---|---|
| Display | Bagel Fat One | Wordmark, day headings |
| Label | Bungee | Times, categories, price tags |
| Body | Space Grotesk | Titles, venues, descriptions |

Each event category has its own colour. All colours and fonts live in [`src/theme/tokens.ts`](src/theme/tokens.ts). Every colour pairing meets WCAG 2.2 AA contrast, touch targets are at least 44 pt, and text scales with the phone's font size setting.

## Tech stack

| Layer | Choice |
|---|---|
| App | React Native with Expo and Expo Router |
| On-device storage | expo-sqlite key-value store (browser storage on web) |
| Connectivity | expo-network |
| Reminders | expo-notifications, local only |
| Icons | expo-symbols |
| Background refresh | expo-background-task (planned) |
| Map | react-native-maps (planned) |
| Backend | Next.js 16 with Postgres (Drizzle ORM); PGlite for local development |
| Admin | Moderation screen in the same Next.js app |

## Why React Native

The app is written in [React Native](https://reactnative.dev), with [Expo](https://expo.dev) providing the tooling and native modules. Screens are built from React Native components, so on a phone they render as real native Android and iOS interface, not a web page. The browser preview uses `react-native-web` and is only for quick checks during development.

I chose React Native over native Android in Kotlin because:

- **One codebase for Android and iOS.** v1 targets both Android 9+ and iOS 15+. Kotlin would cover Android only, so iOS would need a second app in Swift.
- **Over-the-air updates.** With EAS Update, fixes and content changes can reach phones without waiting for a store release.
- **Fast iteration.** Expo Go runs the app on a real phone straight from the dev server, and Expo covers what v1 needs (storage, notifications, network state, maps) without writing native code.

The trade-off is that Kotlin would give a smaller app and slightly better performance on low-end phones. React Native is fast enough for the target phone (a 2 GB RAM Android) if lists stay lean and the app loads from the on-device cache, so that trade-off is worth it.

## Roadmap

1. **Foundation**: project setup, navigation, event schema, on-device storage, seed data *(done)*
2. **Core browsing**: week list, filters, search, event detail, directions, sharing *(done)*
3. **Offline**: cache, delta sync, retry with backoff, offline banner *(done; twice-daily background refresh still to do)*
4. **Saved and reminders** *(done)*
5. **Submissions and admin**: app form, offline queue, backend API and moderation screen *(done; deployment, rejection emails and per-person admin accounts still to do)*
6. **Map and alerts**: alerts for changed saved events *(done)*; map view and "Tonight" shortcut *(to do)*
7. **Beta**: 30–50 testers, then Play Store release

Also still to do: image thumbnails with a data-saver setting, and moving all on-screen text into one place so Swahili can be added.

## License

[MIT](LICENSE)

## AI assistance

I built parts of this project with help from an AI coding assistant (Claude). I made the key decisions myself: the requirements and v1 scope, choosing React Native, the poster-inspired visual direction, and the design changes along the way.