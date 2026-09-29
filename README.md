# Growra

A habit tracker with game mechanics. Completing real-life tasks earns coins and XP. Companions join when you use Growra in their style (routines, timers, planning ahead…), grow through Bond and evolve. Every active day adds a tile to a road through the valley, with camps to decorate. Streaks reward consistency. Everything is stored locally on the device (no account, no backend).

Design and rules: [`Documents/PROJECT_SPEC.md`](Documents/PROJECT_SPEC.md).

## Stack

Expo 54 · React Native 0.81 · TypeScript · Expo Router (single root layout rendering `src/App.tsx`) · AsyncStorage · expo-audio.

## Run

```bash
npm install
npx expo start          # Expo Go / emulator / web
```

## Checks

```bash
npx tsc --noEmit
npm run lint
npm test                # jest, runs in Europe/Lisbon time to cover daylight-saving changes
```

## Android release

EAS builds (`eas.json`): `eas build -p android --profile production` produces an AAB; `eas submit` uploads to the internal track. Package: `com.growra.app`. Bump `expo.version` / `android.versionCode` in `app.json` for each release.

## Code map

- `src/App.tsx` — screen switching, state persistence, tutorial flow
- `src/utils/gameplay.ts` — rewards, streaks, companion actions
- `src/utils/companions.ts` — usage signals, who joins when, Bond, perks, mood
- `src/utils/journey.ts` — day records, the road (tiles, camps, regions), decorations, focus finds
- `src/utils/taskSchedule.ts` — due dates and recurring-task resets
- `src/services/gameStateService.ts` — save/load, migrations, backup codes
- `src/screens/`, `src/components/` — UI
