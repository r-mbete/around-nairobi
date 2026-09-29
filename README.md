# Around Nairobi

**What's happening in the city this week?**

Around Nairobi is a mobile app that lists the week's events in Nairobi: gigs, markets, exhibitions, talks, sport and community meetups, browsable by day and by neighbourhood.

It is built to work offline. Many people in Nairobi browse on a patchy connection or run out of bundles mid-week, so the week's listings download once and keep working with no data at all.

> **Status:** early development. The home screen lists sample events grouped by day. Filters, search, event detail, saving, reminders and the offline cache are next.

## Features planned for v1

- **This week**: events for today and the next 6 days, grouped by day, with time, venue, neighbourhood, category and price
- **Filters and search**: by category, neighbourhood and free events, with text search that works offline
- **Event detail**: full description, directions in Google Maps, and sharing to WhatsApp
- **Saved events and reminders**: save an event and get a local notification before it starts
- **Organiser submissions**: submit an event for review, with offline submissions queued until a connection returns
- **Offline-first**: the app always loads from the local cache, syncs only what changed, and shows when the data was last updated

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

### Checks

Run both before opening a pull request:

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
```

## Project structure

```
src/
  app/           Screens (Expo Router: every file is a route)
  components/    Reusable UI, such as EventCard and Frieze
  data/          Event types, sample data and date helpers
  theme/         Design tokens: colours, fonts, spacing
```

Always install packages with `npx expo install <package>` rather than `npm install`, so versions match the Expo SDK.

## Design

The look is based on a riso-print travel poster: flat, saturated colour blocks on deep navy, chunky hand-cut lettering, and decorative borders of eyes and diamonds.

| Role | Font | Used for |
|---|---|---|
| Display | Bagel Fat One | Wordmark, day headings |
| Label | Bungee | Times, categories, price tags |
| Body | Space Grotesk | Titles, venues, descriptions |

Each event category has its own colour. All colours and fonts live in [`src/theme/tokens.ts`](src/theme/tokens.ts). Every colour pairing meets WCAG 2.2 AA contrast, and text scales with the phone's font size setting.

## Tech stack

| Layer | Choice |
|---|---|
| App | React Native with Expo and Expo Router |
| Local storage | expo-sqlite (planned) |
| Reminders | expo-notifications, local only (planned) |
| Background refresh | expo-background-task (planned) |
| Map | react-native-maps (planned) |
| Backend | PostgreSQL behind a small REST API (planned) |

## Roadmap

1. **Foundation**: project setup, navigation, event schema, local database, seed data *(in progress)*
2. **Core browsing**: week list, filters, search, event detail, directions, sharing
3. **Offline**: local cache, delta sync, retry with backoff, offline banner
4. **Saved and reminders**
5. **Submissions and admin**
6. **Map and change alerts**
7. **Beta**: 30–50 testers, then Play Store release

## License

[MIT](LICENSE)
