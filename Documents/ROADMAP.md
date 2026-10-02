# Growra roadmap: future additions

Things deliberately left for **after the current releases** (1.7.0 Growra Plus, 1.8.0 companion rooms). Each item says where its design lives. When you pick one up, write a plan for it (`docs/superpowers/plans/`) before building.

Last updated: 2 October 2026.

---

## Next update: room sharing (companion rooms, phase 2)

The design is already approved. See `docs/superpowers/specs/2026-10-01-companion-rooms-design.md`, §3 "Room code" and "Copying", and the phase 2 items in its Testing section.

- **Room codes:** a short text code (`GROWRA-ROOM-…`) holding a room's style and every item's type, position, size, flip and layer. Versioned and checksummed, with no personal data.
- **QR code on shared pictures:** the "Made with Growra" footer also carries the room code as a small QR.
- **Copy a room:** editor → ⋯ → "Copy a room". Paste a code, or pick a shared picture and read the QR from it (`expo-camera` scan-from-image).
- **Ghosts:** copied items you don't own appear as faint outlines, with a "You need: …" list. An item you own that's placed elsewhere shows as "In Camp 3". A ghost becomes the real item when you get one.
- **Share text with the picture:** `expo-sharing` can't attach text to an image on Android, so 1.8.0 puts the message in the share dialog title only. Phase 2 needs a library such as `react-native-share` to send text and picture together.
- **New libraries:** `expo-camera`, `react-native-qrcode-svg`, `react-native-svg`. Check each against the Expo SDK with a native build first.

## Companion rooms: small fixes found in review

Not blocking 1.8.0, but worth a quick pass:

- **Camp placement guard:** `placeDecoration` should itself refuse room decorations and furniture. Today only the screens filter them out.
- **Undo:** an edit that changes nothing (same rename, a drag clamped to the same spot) shouldn't replace the one undo step.
- **Rename box:** start empty, with the default name as a placeholder, so saving unchanged doesn't lock the name in.
- **Easter "Returns in {month}":** after this year's Easter window has passed, use next year's date.
- **Pinch preview:** clamp the live preview to 50–150% so it doesn't snap back on release.
- **Share quality:** check the 1080×1350 picture on a phone. If it's soft, or the footer is missing, capture a larger hidden canvas or wait for the footer to lay out.
- **Corrupt saves:** remove duplicate items with the same decoration inside one room.

## Growra Plus: later perks

From `Documents/GAME_REDESIGN.md` §12. The first version of Plus has themes, full Journey history, CSV export and no ads.

- **Cloud backup and restore** (Google Drive app-data folder, no server). The most valuable next perk; needs Google sign-in.
- **Alternate app icons.**
- **Custom timer and reminder sounds.**
- **A home-screen widget.**
- **Cosmetic packs:** companion outfits and road themes. The art is listed as P4 cosmetics in `Documents/IMAGE_REQUESTS.md`.
- **More seasonal room sets** after the first year: for example Lunar New Year and a summer festival.

## Plus and ads: small fixes found in review

- **Restore at startup:** if Play answers before the save has loaded, keep that result instead of losing it until the next foreground.
- **"Already owned":** Play's "already owned" error shows a generic error; it should run a restore instead.
- **CSV export:** add an error message, and avoid opening two share sheets in a row (zip the files or combine them).
- **Ads:** a fast double tap can start two ads (still one find). Guard it with a ref.
- **Ads:** the "No ad available" message is titled "Growra Plus"; give it a neutral title.
- **Foreground sync:** the foreground sync handler uses a stale copy of the game state. Read it from `gameStateRef`.
- **Theme in child screens:** children use the saved theme rather than the one Plus allows. Pass the resolved theme down.
- **CSV:** task names starting with `=`, `+`, `-` or `@` could act as spreadsheet formulas. Prefix them with `'`.

## Before real money

These can't be done from code alone:

- **Public Play listing:** production needs 12 closed testers for 14 days, and the store listing filled in.
- **AdMob:** create the app once the listing is public, then swap the test IDs in `app.json` and `src/constants/adConfig.ts`. `npm run check:release` fails until both are real.
- **Data safety form:** declare purchase history and the advertising ID.
- **Privacy policy:** run the `growra-website` deploy workflow so the policy URL is live, then link it in the Play listing.
- **Payouts:** add a bank account in the payments profile.

## Other ideas

- **Notifications:** timer alerts while the app is in the background, plus an optional daily reminder (`expo-notifications`). This is the main retention gap; see `known-issues/growra.md`.
- **Optional planning tools:** "Plan my day" (Morning / Afternoon / Evening slots) and "Wrap up" (tidy what's left). See `Documents/GAME_REDESIGN.md` §3. Still undecided whether to build them.
- **Explore finds on the companion:** the companion holds or wears the latest find on the dashboard for the day, so the reward shows straight away.
- **Find collection:** a "found 10 of 17" collection page, with a small badge or scene unlock when it's complete.
- **In-app room gallery:** players browse and like each other's rooms. This needs a server, accounts and moderation, so it waits for a backend.
