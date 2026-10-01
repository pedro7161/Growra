# Growra Plus, rewarded ads and the Growra website: design

Date: 2026-10-01 · Status: awaiting review · Context: `Documents/GAME_REDESIGN.md` §12

## Goal

Start earning a little from Growra, to help fund future games, without breaking the game's rule: **money and ads buy looks, comfort and convenience, never progress.** Success for this version means:

- a €0.99 purchase works end to end on Play internal testing;
- the purchase is restored after a reinstall;
- the Plus perks unlock;
- rewarded ads (Google test ads until AdMob accepts the app) give a decoration, and Plus removes them.

The developer is currently the only user, so gating existing features affects no one.

## Scope and build order

1. **Billing, Plus state, and three perks**: themes, full Journey history, CSV export.
2. **Rewarded ads** with EU consent and decoration finds; Plus removes them.
3. **Website repo** `growra-website` (GitHub Pages): a landing page and the privacy policy.

All three ship in that order. Out of scope, as later projects: cloud backup (Google Drive), alternate app icons, custom timer sounds, the widget, and cosmetic packs.

## 1. Billing and Plus

### Product

- One-time in-app product, id `growra_plus`.
- Price **€0.99**, set in Play Console. The price can change there with no new build.
- Library: **`expo-iap`** (Google Play Billing directly, no third-party service). It needs an EAS native build, as Growra already uses.

### Components

| Unit | Purpose | Depends on |
|---|---|---|
| `src/services/plusService.ts` | The **only** importer of `expo-iap`. `init()`, `getPrice()`, `buy()`, `restore()`, acknowledgement. Returns plain results (`purchased`, `pending`, `cancelled`, `unavailable`, `error`). | `expo-iap` |
| `src/utils/plus.ts` | Pure gate functions, no billing. See below. | types only |
| `usePlus()` hook (provider in `App.tsx`) | Exposes `isPlus`, `price`, `buy()`, `restore()`, `status` to screens. | plusService, save |
| `src/components/GrowraPlusModal.tsx` | The Plus sheet: the perks and "no ads" line, the price, **Buy** and **Restore purchase**. | usePlus |

Pure gate functions in `src/utils/plus.ts`:

- `isThemeAllowed(themeId, isPlus)`
- `resolveTheme(themeId, isPlus)`: falls back to `mint`.
- `isLookBackVisible(campIndex, campsReached, isPlus)`: free shows only the last 4 camps.
- `buildHistoryCsv(state)`

### State

- `isPlus` is cached in the existing save (AsyncStorage key `growra_save_data`), with a save migration that defaults it to false. Plus therefore works offline.
- Play is the source of truth. A quiet `restore()` runs at start and on return to the foreground. If no purchase is found (for example after a refund), `isPlus` becomes false, and a selected Plus theme falls back to Mint.

### Purchase flow

| Step | Result |
|---|---|
| Buy, Play returns **purchased** | Acknowledge, set `isPlus = true`, save, show "Thanks! Plus is unlocked". |
| **Pending** (for example a cash payment) | Show "Payment pending". Unlocks on a later check once Play confirms. |
| **Cancelled** | No change, no error. |
| **Unavailable** (offline, no Play) | Keep the cached `isPlus`. The Buy button reads "Store unavailable, try again later". |
| **Error** | A friendly message with retry. `isPlus` only changes after Play confirms. |
| Acknowledgement failed | Retried on the next start (Play auto-refunds after 3 days without one). |

### Perks

- **Themes:** 3 new themes join `mint`, `sunset` and `ocean`. `AppThemeId` grows accordingly, and the colours follow the existing `AppTheme` fields. Settings shows them with a "Plus" badge; tapping one without Plus opens the Plus sheet.
- **Journey history:** look-back cards for camps older than the last 4 show "See this week with Plus" for free users. Tiles, camps and decorations stay visible to everyone.
- **CSV export:** a Settings button, "Export your history (CSV)", writes two files with `expo-file-system` and opens the share sheet with **`expo-sharing`** (new dependency).
  - `growra-tasks.csv`: name, category, frequency, priority, due date, status.
  - `growra-completions.csv`: date, local time, task name.
  - Commas, quotes and newlines are escaped per RFC 4180.

### Never gated

Tasks, custom tasks, companions, Bond, evolution, coins, the road, camps and decorations: everything that exists today, except look-back cards older than 4 camps.

## 2. Rewarded ads

- **Library:** `react-native-google-mobile-ads`, with its Expo config plugin and the UMP consent API.
- **Placement:** a single button, **"Send {companion} exploring"**, on the Companions screen and in the Journey decorations sheet. Never on Tasks, Calendar or the Dashboard's task list. No banners, no interstitials.
- **Reward:** a **find**, a random decoration from the found-only pool (shell, feather, clover, acorn) plus **4 new ad-only finds**. Their art is a Codex job, in the same style as the existing decoration sprites. Never coins, Bond or XP.
- **Cap:** 2 finds a day, shared by both placements. The counter is stored in the save and keyed by calendar day, using the existing DST-safe day helpers. The button shows "1 left today", then "Back tomorrow".
- **Plus:** the same button gives the find **without an ad**, with the same cap of 2 a day. No ads SDK request is ever made for Plus users.
- **Consent:** the UMP form appears the first time the button is tapped, not at launch, following the SHARDMARCH consent pattern.
- **Failure:** with no consent, no fill or a load error, the button shows "No ad available right now", and no reward is given unless the ad completed.
- **IDs:** Google's test app ID and rewarded unit until AdMob accepts the app, which needs a public Play listing. A release check script, like SHARDMARCH's `check-release-config`, warns on test IDs and fails a strict release build.

## 3. Website repo `growra-website`

- A public repo on GitHub Pages, in the same shape as `shardmarch-website`, with Actions manual-only.
- `index.html`: what Growra is, with the icon, feature graphic and screenshots, and Open Graph tags.
- `privacy-policy.html`:
  - Saves stay on the device.
  - Purchases are handled by Google Play.
  - Ads come from AdMob, which uses the advertising ID, with consent requested in the EU and UK.
  - No accounts and no analytics.
  - Contact goes through the Google Play listing. **No email or personal contact anywhere on the site.**

## Developer actions (outside code)

1. Play Console: create a **payments profile / merchant account** (identity and bank details).
2. Add your own account under **License testing**.
3. After step 1, Claude creates the in-app product `growra_plus` (€0.99) through the Play tools.
4. Before real money: link the privacy policy URL in the listing, fill in **data safety** (purchase history, advertising ID), create the AdMob app once the listing is public, and complete the production requirement (12 closed testers for 14 days).

## Testing

- **Jest, with a fake `expo-iap` and fake ads module:**
  - `plusService` results: purchased, pending, cancelled, unavailable, acknowledgement retry, restore found and not found.
  - The gates in `plus.ts`: theme fallback; look-back visibility at 0, 4, 5 and 20 camps.
  - CSV escaping and columns.
  - The daily find cap across midnight and a DST change.
  - The Plus no-ad path.
- **Device test on internal testing as a license tester:** buy, check the perks, reinstall to confirm restore, watch a test ad and get a find, and check the cap.
- **Before each release:** tsc, eslint, jest and `expo export -p android`.
