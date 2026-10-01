# Growra Plus, rewarded ads and website: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a €0.99 one-time Growra Plus unlock (themes, full Journey look-back, CSV export) and opt-in rewarded ads that give decoration finds (removed by Plus), plus a `growra-website` repo with the privacy policy.

**Architecture:** All store and ad SDK calls sit behind two small adapter interfaces (`BillingClient`, `AdsClient`). The services built on them (`plusService`, `adsService`) and all rules (`plus.ts`, `explore.ts`, `historyCsv.ts`) are pure, injectable and Jest-tested with fakes. Plus ownership and the daily explore counter live in `GameState`, so they're offline-safe, and Play is re-checked on start and foreground.

**Tech stack:** Expo SDK 54, React Native 0.81, TypeScript, Jest (ts-jest, `TZ=Europe/Lisbon`), `expo-iap` (Google Play Billing), `react-native-google-mobile-ads@16.5.0` (AdMob with the UMP consent form), `expo-sharing ~14.0.8`, `expo-file-system`, EAS builds.

**Spec:** `docs/superpowers/specs/2026-10-01-growra-plus-design.md`

## Global constraints

- Product id `growra_plus`, a one-time in-app product, price **€0.99**, set in Play Console and never hard-coded in the app (the price string comes from Play).
- **Money and ads buy looks, never progress.** Never grant coins, Bond or XP from Plus or ads.
- Ads only on the explore button (Companions screen and Journey decorations sheet). Never on Tasks, Calendar or the Dashboard task list. **Rewarded only**: no banners, no interstitials.
- Explore cap: **2 finds a day**, shared by both placements and with or without Plus. Plus users never trigger an ads SDK call.
- Free Journey look-back: the **last 4 camps** (`FREE_LOOKBACK_CAMPS = 4`).
- AdMob test IDs until AdMob accepts the app:
  - Android app id `ca-app-pub-3940256099942544~3347511713`
  - rewarded unit `ca-app-pub-3940256099942544/5224354917`
- Website: **no email or personal contact anywhere**.
- All user-facing strings are in **both** `en` and `pt` in `src/constants/appCopy.ts`.
- Before every commit: `npx tsc --noEmit` clean, and `npx jest` all green.

## Review focus

1. **Store unreachable at launch** (offline, or a phone without Play): a user who already bought keeps Plus. `restore()` returns `unavailable` and must never clear `isPlus`. Pinned in Task 4 (`restore unavailable keeps cached ownership`) and Task 8 (the controller ignores `unavailable`).
2. **Explore at a DST change or midnight:** the cap resets on the local calendar day, not every 24 hours. Pinned in Task 5 (the Lisbon 2026-10-25 test).
3. **A Plus theme is selected, then Plus is refunded:** the app must fall back to Mint, not crash on a missing theme. Pinned in Task 3 (`resolveTheme`) and Task 8 (fallback when ownership turns false).
4. **Commas, quotes or newlines in task names** in the CSV: the files must stay valid. Pinned in Task 6.
5. **The ad closes without the reward** (skipped early), or loads too slowly: no find is given, and the button doesn't hang forever. Pinned in Task 7 (`dismissed` gives no reward) and the 15-second timeout in the ads client.

---

### Task 1: Dependencies and a native build check

**Files:**
- Modify: `package.json`, `package-lock.json`, `app.json`

This de-risks the native libraries before any code depends on them. `react-native-google-mobile-ads@17` needs React Native 0.86+, so pin **16.5.0**.

- [ ] **Step 1: Install**

```bash
cd /mnt/HDD/Projects/Growra
npx expo install expo-sharing
npm install expo-iap@5.8.2 react-native-google-mobile-ads@16.5.0
```

- [ ] **Step 2: Register the config plugins** in `app.json` → `expo.plugins` (append after `"expo-asset"`):

```json
"expo-iap",
[
  "react-native-google-mobile-ads",
  {
    "androidAppId": "ca-app-pub-3940256099942544~3347511713",
    "iosAppId": "ca-app-pub-3940256099942544~1458002511"
  }
]
```

- [ ] **Step 3: Prove that a native Android build compiles** (the local `android/` is gitignored and debug-only):

```bash
npx expo prebuild -p android --clean
cd android && ./gradlew :app:assembleDebug -q && cd ..
```

Expected: the build succeeds.
- If `expo-iap@5.8.2` fails to compile against SDK 54, retry with `npm install expo-iap@4.5.1`, then the newest `4.x`. Record the working version in the commit message.
- If the ads plugin rejects the options object, use the root-level `app.json` key `"react-native-google-mobile-ads": { "android_app_id": "...", "ios_app_id": "..." }` instead.

- [ ] **Step 4: Verify the JS side**

Run: `npx tsc --noEmit && npx jest`
Expected: clean; 42 tests pass.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "chore: add expo-iap, google-mobile-ads 16.5.0 and expo-sharing"
```

---

### Task 2: Plus and explore state in the save

**Files:**
- Modify: `src/types/index.ts`, `src/utils/initialState.ts`, `src/services/gameStateService.ts`
- Test: `__tests__/gameStateService.test.ts`

**Interfaces:**
- Produces:
  - `PlusState { owned: boolean; lastCheckedAt: number }`
  - `ExploreState { day: number; count: number }`
  - `GameState.plus` and `GameState.explore`

- [ ] **Step 1: Write the failing test** (append to `__tests__/gameStateService.test.ts`):

```ts
describe('plus and explore state', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults a new game to no Plus and no finds today', () => {
    const state = createInitialGameState();
    expect(state.plus).toEqual({ owned: false, lastCheckedAt: 0 });
    expect(state.explore).toEqual({ day: 0, count: 0 });
  });

  it('migrates an older save without plus/explore', async () => {
    const legacy = createSaveData(createInitialGameState()) as any;
    delete legacy.gameState.plus;
    delete legacy.gameState.explore;
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(legacy));
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    expect(result.saveData.gameState.plus).toEqual({ owned: false, lastCheckedAt: 0 });
    expect(result.saveData.gameState.explore).toEqual({ day: 0, count: 0 });
  });

  it('keeps an owned Plus through save and load', async () => {
    const state = { ...createInitialGameState(), plus: { owned: true, lastCheckedAt: 5 } };
    await gameStateService.saveGame(createSaveData(state));
    const result = await gameStateService.loadGame();
    if (result.status !== 'loaded') throw new Error('not loaded');
    expect(result.saveData.gameState.plus.owned).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/gameStateService.test.ts`
Expected: FAIL. `plus` is undefined (type errors from ts-jest are also acceptable as the failure).

- [ ] **Step 3: Implement**

In `src/types/index.ts`, before `export interface GameState`:

```ts
// Growra Plus ownership, cached so Plus works offline; Play is re-checked on start.
export interface PlusState {
  owned: boolean;
  lastCheckedAt: number;
}

// Rewarded "explore" finds: the start of the day of the last find, and the finds that day.
export interface ExploreState {
  day: number;
  count: number;
}
```

and inside `GameState` (after `streak: Streak;`):

```ts
  plus: PlusState;
  explore: ExploreState;
```

In `src/utils/initialState.ts` `createInitialGameState()` (after `streak: createInitialStreak(),`):

```ts
    plus: { owned: false, lastCheckedAt: 0 },
    explore: { day: 0, count: 0 },
```

In `src/services/gameStateService.ts`:
- Add `| "plus" | "explore"` to the `Omit<GameState, ...>` union of `PersistedGameState`.
- Add to its `& { ... }` part: `plus?: PlusState; explore?: ExploreState;`. Import both types from `../types`.
- In `migrateSaveData`, inside the `migratedGameState` object (after `decorations: ...,`):

```ts
    plus: saveData.gameState.plus ?? { owned: false, lastCheckedAt: 0 },
    explore: saveData.gameState.explore ?? { day: 0, count: 0 },
```

- [ ] **Step 4: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/utils/initialState.ts src/services/gameStateService.ts __tests__/gameStateService.test.ts
git commit -m "feat(plus): add plus and explore state to the save with migration"
```

---

### Task 3: Plus themes and gates

**Files:**
- Create: `src/utils/plus.ts`
- Modify: `src/types/index.ts` (`AppThemeId`), `src/constants/appTheme.ts`
- Test: `__tests__/plus.test.ts`

**Interfaces:**
- Produces:
  - `PLUS_THEME_IDS: readonly AppThemeId[]`
  - `FREE_LOOKBACK_CAMPS = 4`
  - `isPlusTheme(id): boolean`
  - `isThemeAllowed(id, isPlus): boolean`
  - `resolveTheme(id, isPlus): AppThemeId`
  - `isLookBackVisible(campIndex, campsReached, isPlus): boolean`

- [ ] **Step 1: Write the failing test** (`__tests__/plus.test.ts`):

```ts
import {
  FREE_LOOKBACK_CAMPS,
  PLUS_THEME_IDS,
  isLookBackVisible,
  isThemeAllowed,
  resolveTheme,
} from '../src/utils/plus';
import { appThemes } from '../src/constants/appTheme';

describe('plus themes', () => {
  it('has three Plus themes that all exist', () => {
    expect(PLUS_THEME_IDS).toEqual(['dusk', 'blossom', 'forest']);
    PLUS_THEME_IDS.forEach((id) => expect(appThemes[id]).toBeDefined());
  });

  it('allows free themes for everyone and Plus themes only with Plus', () => {
    expect(isThemeAllowed('ocean', false)).toBe(true);
    expect(isThemeAllowed('dusk', false)).toBe(false);
    expect(isThemeAllowed('dusk', true)).toBe(true);
  });

  it('falls back to mint when a Plus theme is no longer allowed', () => {
    expect(resolveTheme('blossom', false)).toBe('mint');
    expect(resolveTheme('blossom', true)).toBe('blossom');
    expect(resolveTheme('sunset', false)).toBe('sunset');
  });
});

describe('journey look-back gate', () => {
  it('shows every card when there are 4 camps or fewer', () => {
    for (let camp = 0; camp < 4; camp += 1) {
      expect(isLookBackVisible(camp, 4, false)).toBe(true);
    }
    expect(isLookBackVisible(0, 0, false)).toBe(true);
  });

  it('shows only the last 4 camps to free users', () => {
    expect(FREE_LOOKBACK_CAMPS).toBe(4);
    expect(isLookBackVisible(0, 5, false)).toBe(false);
    expect(isLookBackVisible(1, 5, false)).toBe(true);
    expect(isLookBackVisible(15, 20, false)).toBe(false);
    expect(isLookBackVisible(16, 20, false)).toBe(true);
  });

  it('shows everything with Plus', () => {
    expect(isLookBackVisible(0, 20, true)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/plus.test.ts`
Expected: FAIL. Cannot find module `../src/utils/plus`.

- [ ] **Step 3: Implement**

`src/types/index.ts`:

```ts
export type AppThemeId = "mint" | "sunset" | "ocean" | "dusk" | "blossom" | "forest";
```

Add to `appThemes` in `src/constants/appTheme.ts` (same fields as the existing themes):

```ts
  dusk: {
    id: "dusk",
    name: "Dusk",
    background: "#f3f1fa",
    surface: "#ffffff",
    surfaceMuted: "#ece8f7",
    text: "#2a2540",
    mutedText: "#6b6585",
    border: "#ddd7ee",
    accent: "#6c4fc4",
    accentSoft: "#e9e2fb",
    accentText: "#ffffff",
    hero: "#5a3fb0",
    heroText: "#ffffff",
    heroMuted: "#e3d9ff",
    success: "#2ca58d",
    warning: "#f39c12",
    warningSoft: "#f8e1b7",
    danger: "#d35454",
  },
  blossom: {
    id: "blossom",
    name: "Blossom",
    background: "#fff5f8",
    surface: "#ffffff",
    surfaceMuted: "#ffe9f0",
    text: "#3a2430",
    mutedText: "#86677a",
    border: "#f3d6e1",
    accent: "#d0567f",
    accentSoft: "#ffe0eb",
    accentText: "#ffffff",
    hero: "#c94a76",
    heroText: "#ffffff",
    heroMuted: "#ffd9e7",
    success: "#2ca58d",
    warning: "#f39c12",
    warningSoft: "#f8e1b7",
    danger: "#d35454",
  },
  forest: {
    id: "forest",
    name: "Forest",
    background: "#f2f6ef",
    surface: "#ffffff",
    surfaceMuted: "#e7efe1",
    text: "#1f2a1c",
    mutedText: "#5f6f5a",
    border: "#d5e0cd",
    accent: "#3f7a35",
    accentSoft: "#dfeed8",
    accentText: "#ffffff",
    hero: "#356b2c",
    heroText: "#ffffff",
    heroMuted: "#d6f0cd",
    success: "#2ca58d",
    warning: "#f39c12",
    warningSoft: "#f8e1b7",
    danger: "#d35454",
  },
```

`src/utils/plus.ts`:

```ts
import { AppThemeId } from "../types";

/** Themes that need Growra Plus (spec §1, perks). */
export const PLUS_THEME_IDS: readonly AppThemeId[] = ["dusk", "blossom", "forest"];

/** Free users see look-back cards for this many most recent camps. */
export const FREE_LOOKBACK_CAMPS = 4;

export function isPlusTheme(themeId: AppThemeId): boolean {
  return PLUS_THEME_IDS.includes(themeId);
}

export function isThemeAllowed(themeId: AppThemeId, isPlus: boolean): boolean {
  return isPlus || !isPlusTheme(themeId);
}

/** The theme to actually use: a Plus theme without Plus falls back to Mint. */
export function resolveTheme(themeId: AppThemeId, isPlus: boolean): AppThemeId {
  return isThemeAllowed(themeId, isPlus) ? themeId : "mint";
}

/** Camp indexes run 0..campsReached-1; free users see only the last FREE_LOOKBACK_CAMPS. */
export function isLookBackVisible(campIndex: number, campsReached: number, isPlus: boolean): boolean {
  return isPlus || campIndex >= campsReached - FREE_LOOKBACK_CAMPS;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: all pass. If `tsc` flags an exhaustive `Record<AppThemeId, ...>` elsewhere, add the three ids there with the same values as `mint`.

- [ ] **Step 5: Commit**

```bash
git add src/utils/plus.ts src/types/index.ts src/constants/appTheme.ts __tests__/plus.test.ts
git commit -m "feat(plus): three Plus themes and pure gate functions"
```

---

### Task 4: `plusService` behind a billing adapter

**Files:**
- Create: `src/services/plusService.ts`, `src/services/expoIapClient.ts`
- Test: `__tests__/plusService.test.ts`

**Interfaces:**
- Produces:
  - `PLUS_PRODUCT_ID = "growra_plus"`
  - `BuyResult = "purchased" | "pending" | "cancelled" | "unavailable" | "error"`
  - `RestoreResult = "owned" | "not-owned" | "unavailable"`
  - `interface BillingClient`
  - `createPlusService(client: BillingClient): PlusService`, where `PlusService = { getPrice(): Promise<string | null>; buy(): Promise<BuyResult>; restore(): Promise<RestoreResult> }`
  - `expoIapClient: BillingClient`

- [ ] **Step 1: Write the failing test** (`__tests__/plusService.test.ts`):

```ts
import { BillingClient, StorePurchase, createPlusService, PLUS_PRODUCT_ID } from '../src/services/plusService';

function purchase(state: StorePurchase['state'], acknowledged = false): StorePurchase {
  return { productId: PLUS_PRODUCT_ID, state, acknowledged, raw: {} };
}

function fakeClient(overrides: Partial<BillingClient> = {}): BillingClient & { acks: number } {
  const client = {
    acks: 0,
    connect: async () => true,
    getPrice: async () => '€0.99',
    purchase: async () => ({ kind: 'purchase' as const, purchase: purchase('purchased') }),
    ownedPurchases: async () => [] as StorePurchase[],
    acknowledge: async () => {
      client.acks += 1;
    },
    ...overrides,
  };
  return client;
}

describe('plusService', () => {
  it('returns the price from the store', async () => {
    expect(await createPlusService(fakeClient()).getPrice()).toBe('€0.99');
  });

  it('acknowledges and reports a completed purchase', async () => {
    const client = fakeClient();
    expect(await createPlusService(client).buy()).toBe('purchased');
    expect(client.acks).toBe(1);
  });

  it('reports pending without acknowledging', async () => {
    const client = fakeClient({ purchase: async () => ({ kind: 'purchase', purchase: purchase('pending') }) });
    expect(await createPlusService(client).buy()).toBe('pending');
    expect(client.acks).toBe(0);
  });

  it('treats a cancelled sheet as cancelled, not an error', async () => {
    const client = fakeClient({ purchase: async () => ({ kind: 'cancelled' }) });
    expect(await createPlusService(client).buy()).toBe('cancelled');
  });

  it('reports unavailable when the store cannot connect', async () => {
    const client = fakeClient({ connect: async () => false });
    const service = createPlusService(client);
    expect(await service.buy()).toBe('unavailable');
    expect(await service.getPrice()).toBeNull();
  });

  it('still reports purchased when acknowledgement throws (retried on restore)', async () => {
    const client = fakeClient({
      acknowledge: async () => {
        throw new Error('network');
      },
    });
    expect(await createPlusService(client).buy()).toBe('purchased');
  });

  it('restore finds an owned purchase and acknowledges it if needed', async () => {
    const client = fakeClient({ ownedPurchases: async () => [purchase('purchased', false)] });
    expect(await createPlusService(client).restore()).toBe('owned');
    expect(client.acks).toBe(1);
  });

  it('restore reports not-owned when Play has no purchase (refund)', async () => {
    expect(await createPlusService(fakeClient()).restore()).toBe('not-owned');
  });

  it('restore unavailable keeps cached ownership (never returns not-owned when offline)', async () => {
    const client = fakeClient({
      ownedPurchases: async () => {
        throw new Error('offline');
      },
    });
    expect(await createPlusService(client).restore()).toBe('unavailable');
  });

  it('retries the connection after a failed connect', async () => {
    let attempts = 0;
    const client = fakeClient({
      connect: async () => {
        attempts += 1;
        return attempts > 1;
      },
    });
    const service = createPlusService(client);
    expect(await service.restore()).toBe('unavailable');
    expect(await service.restore()).toBe('not-owned');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/plusService.test.ts`
Expected: FAIL. Module not found.

- [ ] **Step 3: Implement** `src/services/plusService.ts`:

```ts
/**
 * Growra Plus purchase logic (spec §1). The store SDK is hidden behind BillingClient so this file is
 * pure and testable; expoIapClient.ts is the only file that imports expo-iap.
 */
export const PLUS_PRODUCT_ID = "growra_plus";

export type BuyResult = "purchased" | "pending" | "cancelled" | "unavailable" | "error";
export type RestoreResult = "owned" | "not-owned" | "unavailable";

export interface StorePurchase {
  productId: string;
  state: "purchased" | "pending" | "unknown";
  acknowledged: boolean;
  raw: unknown; // the SDK's own purchase object, passed back for acknowledgement
}

export type PurchaseOutcome =
  | { kind: "purchase"; purchase: StorePurchase }
  | { kind: "cancelled" }
  | { kind: "error" };

export interface BillingClient {
  connect(): Promise<boolean>;
  getPrice(productId: string): Promise<string | null>;
  purchase(productId: string): Promise<PurchaseOutcome>;
  ownedPurchases(): Promise<StorePurchase[]>;
  acknowledge(purchase: StorePurchase): Promise<void>;
}

export interface PlusService {
  getPrice(): Promise<string | null>;
  buy(): Promise<BuyResult>;
  restore(): Promise<RestoreResult>;
}

export function createPlusService(client: BillingClient): PlusService {
  let connecting: Promise<boolean> | null = null;

  async function connect(): Promise<boolean> {
    if (!connecting) {
      connecting = client.connect().catch(() => false);
    }
    const ok = await connecting;
    if (!ok) {
      connecting = null; // try again next time
    }
    return ok;
  }

  async function acknowledgeIfNeeded(purchase: StorePurchase): Promise<void> {
    if (purchase.state !== "purchased" || purchase.acknowledged) return;
    try {
      await client.acknowledge(purchase);
    } catch {
      // Play gives 3 days; the next restore() retries.
    }
  }

  return {
    async getPrice() {
      if (!(await connect())) return null;
      try {
        return await client.getPrice(PLUS_PRODUCT_ID);
      } catch {
        return null;
      }
    },

    async buy() {
      if (!(await connect())) return "unavailable";
      try {
        const outcome = await client.purchase(PLUS_PRODUCT_ID);
        if (outcome.kind === "cancelled") return "cancelled";
        if (outcome.kind === "error") return "error";
        if (outcome.purchase.state === "pending") return "pending";
        if (outcome.purchase.state !== "purchased") return "error";
        await acknowledgeIfNeeded(outcome.purchase);
        return "purchased";
      } catch {
        return "error";
      }
    },

    async restore() {
      if (!(await connect())) return "unavailable";
      try {
        const owned = (await client.ownedPurchases()).filter(
          (purchase) => purchase.productId === PLUS_PRODUCT_ID && purchase.state === "purchased",
        );
        for (const purchase of owned) {
          await acknowledgeIfNeeded(purchase);
        }
        return owned.length > 0 ? "owned" : "not-owned";
      } catch {
        return "unavailable";
      }
    },
  };
}
```

`src/services/expoIapClient.ts` (not imported by tests; checked by `tsc` against the installed `expo-iap`. If the installed version's names differ, adapt only this file and keep the `BillingClient` contract):

```ts
import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from "expo-iap";
import { BillingClient, PurchaseOutcome, StorePurchase } from "./plusService";

function toStorePurchase(purchase: Purchase): StorePurchase {
  return {
    productId: purchase.productId,
    state: purchase.purchaseState,
    acknowledged: Boolean((purchase as { isAcknowledgedAndroid?: boolean | null }).isAcknowledgedAndroid),
    raw: purchase,
  };
}

export const expoIapClient: BillingClient = {
  async connect() {
    return Boolean(await initConnection());
  },

  async getPrice(productId) {
    const products = (await fetchProducts({ skus: [productId], type: "in-app" })) ?? [];
    const product = (products as { id: string; displayPrice?: string }[]).find((item) => item.id === productId);
    return product?.displayPrice ?? null;
  },

  purchase(productId) {
    return new Promise<PurchaseOutcome>((resolve) => {
      let settled = false;
      const settle = (outcome: PurchaseOutcome) => {
        if (settled) return;
        settled = true;
        updated.remove();
        failed.remove();
        resolve(outcome);
      };
      const updated = purchaseUpdatedListener((purchase) => {
        if (purchase.productId === productId) settle({ kind: "purchase", purchase: toStorePurchase(purchase) });
      });
      const failed = purchaseErrorListener((error) => {
        settle(error.code === ErrorCode.UserCancelled ? { kind: "cancelled" } : { kind: "error" });
      });
      requestPurchase({ request: { google: { skus: [productId] } }, type: "in-app" }).catch(() =>
        settle({ kind: "error" }),
      );
    });
  },

  async ownedPurchases() {
    return ((await getAvailablePurchases()) ?? []).map(toStorePurchase);
  },

  async acknowledge(purchase) {
    await finishTransaction({ purchase: purchase.raw as Purchase, isConsumable: false });
  },
};
```

- [ ] **Step 4: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/plusService.ts src/services/expoIapClient.ts __tests__/plusService.test.ts
git commit -m "feat(plus): plusService with a BillingClient adapter for expo-iap"
```

---

### Task 5: Explore finds (daily cap and new ad-only finds)

**Files:**
- Create: `src/utils/explore.ts`
- Modify: `src/utils/journey.ts` (`DecorationType`, `DECORATION_TYPES`, `FIND_POOL`), `src/constants/appCopy.ts` (`decorationNames` for `en` and `pt`)
- Test: `__tests__/explore.test.ts`

**Interfaces:**
- Consumes: `ExploreState`, `GameState` (Task 2); `getStartOfDay` (`src/utils/taskSchedule.ts`); `generateId` (`src/utils/idUtils.ts`)
- Produces:
  - `EXPLORE_FINDS_PER_DAY = 2`
  - `EXPLORE_POOL: DecorationType[]`
  - `getExploreLeft(explore, now): number`
  - `grantExploreFind(state, now, random): { state: GameState; find: DecorationType | null }`

- [ ] **Step 1: Write the failing test** (`__tests__/explore.test.ts`):

```ts
import { EXPLORE_FINDS_PER_DAY, EXPLORE_POOL, getExploreLeft, grantExploreFind } from '../src/utils/explore';
import { getFocusFind } from '../src/utils/journey';
import { createInitialGameState } from '../src/utils/initialState';

const noon = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0).getTime();

describe('explore finds', () => {
  it('gives two finds a day, then none', () => {
    let state = createInitialGameState();
    const now = noon(2026, 10, 1);
    expect(getExploreLeft(state.explore, now)).toBe(EXPLORE_FINDS_PER_DAY);
    for (let i = 0; i < EXPLORE_FINDS_PER_DAY; i += 1) {
      const result = grantExploreFind(state, now, 0.5);
      expect(result.find).not.toBeNull();
      state = result.state;
    }
    expect(getExploreLeft(state.explore, now)).toBe(0);
    const blocked = grantExploreFind(state, now, 0.5);
    expect(blocked.find).toBeNull();
    expect(blocked.state).toBe(state);
    expect(state.decorations).toHaveLength(2);
  });

  it('resets at local midnight across the DST change (Lisbon 2026-10-25)', () => {
    let state = createInitialGameState();
    const lateSaturday = new Date(2026, 9, 24, 23, 30).getTime();
    state = grantExploreFind(state, lateSaturday, 0).state;
    state = grantExploreFind(state, lateSaturday, 0).state;
    expect(getExploreLeft(state.explore, lateSaturday)).toBe(0);
    const earlySunday = new Date(2026, 9, 25, 0, 30).getTime();
    expect(getExploreLeft(state.explore, earlySunday)).toBe(EXPLORE_FINDS_PER_DAY);
  });

  it('never touches coins, Bond or XP', () => {
    const state = createInitialGameState();
    const next = grantExploreFind(state, noon(2026, 10, 1), 0.99).state;
    expect(next.coins).toBe(state.coins);
    expect(next.totalExperience).toBe(state.totalExperience);
    expect(next.pets).toBe(state.pets);
  });

  it('picks from the explore pool, which includes the 4 ad-only finds', () => {
    const ids = EXPLORE_POOL.map((type) => type.id);
    ['comet-shard', 'moonstone', 'rainbow-ribbon', 'firefly-jar', 'shell', 'acorn'].forEach((id) =>
      expect(ids).toContain(id),
    );
    const last = grantExploreFind(createInitialGameState(), noon(2026, 10, 1), 0.999999).find;
    expect(last).toEqual(EXPLORE_POOL[EXPLORE_POOL.length - 1]);
  });

  it('keeps the ad-only finds out of the focus-timer finds', () => {
    const focusIds = [3, 6, 9, 12, 15, 18].map((n) => getFocusFind(n)?.id);
    ['comet-shard', 'moonstone', 'rainbow-ribbon', 'firefly-jar'].forEach((id) => expect(focusIds).not.toContain(id));
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/explore.test.ts`
Expected: FAIL. Module not found.

- [ ] **Step 3: Implement**

In `src/utils/journey.ts`:
- Extend `DecorationType` with `/** Only from rewarded "explore" finds, never from focus timers. */ exploreOnly?: boolean;`.
- Append to `DECORATION_TYPES`:

```ts
  { id: "comet-shard", icon: "☄️", price: 0, exploreOnly: true },
  { id: "moonstone", icon: "🌙", price: 0, exploreOnly: true },
  { id: "rainbow-ribbon", icon: "🌈", price: 0, exploreOnly: true },
  { id: "firefly-jar", icon: "🫙", price: 0, exploreOnly: true },
```

- Change the focus pool line to:

```ts
const FIND_POOL = DECORATION_TYPES.filter((type) => type.price === 0 && !type.exploreOnly);
```

In `src/constants/appCopy.ts`, add to `decorationNames`:
- `en`: `"comet-shard": "comet shard", moonstone: "moonstone", "rainbow-ribbon": "rainbow ribbon", "firefly-jar": "firefly jar",`
- `pt`: `"comet-shard": "fragmento de cometa", moonstone: "pedra da lua", "rainbow-ribbon": "fita arco-íris", "firefly-jar": "frasco de pirilampos",`

`src/utils/explore.ts`:

```ts
import { DecorationType, DECORATION_TYPES } from "./journey";
import { getStartOfDay } from "./taskSchedule";
import { generateId } from "./idUtils";
import { ExploreState, GameState } from "../types";

/** Spec §2: two rewarded finds a day, with or without Plus. */
export const EXPLORE_FINDS_PER_DAY = 2;

/** Every found-only decoration: the focus finds plus the explore-only ones. */
export const EXPLORE_POOL: DecorationType[] = DECORATION_TYPES.filter((type) => type.price === 0);

export function getExploreLeft(explore: ExploreState, now: number): number {
  if (explore.day !== getStartOfDay(now)) return EXPLORE_FINDS_PER_DAY;
  return Math.max(0, EXPLORE_FINDS_PER_DAY - explore.count);
}

/** Adds one random find to the bag. `random` is in [0, 1) so tests can pick the find. */
export function grantExploreFind(
  state: GameState,
  now: number,
  random: number,
): { state: GameState; find: DecorationType | null } {
  if (getExploreLeft(state.explore, now) === 0) return { state, find: null };
  const day = getStartOfDay(now);
  const count = state.explore.day === day ? state.explore.count + 1 : 1;
  const find = EXPLORE_POOL[Math.min(EXPLORE_POOL.length - 1, Math.floor(random * EXPLORE_POOL.length))];
  return {
    find,
    state: {
      ...state,
      explore: { day, count },
      decorations: [...state.decorations, { id: generateId(), typeId: find.id, camp: -1, spot: -1 }],
      lastPlayedAt: now,
    },
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: all pass, including the existing `journey.test.ts`. If a `journey.test.ts` assertion depended on the old `FIND_POOL` length, keep it as is: the focus pool is unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/utils/explore.ts src/utils/journey.ts src/constants/appCopy.ts __tests__/explore.test.ts
git commit -m "feat(ads): explore finds with a daily cap of 2 and four explore-only decorations"
```

---

### Task 6: History CSV

**Files:**
- Create: `src/utils/historyCsv.ts`
- Test: `__tests__/historyCsv.test.ts`

**Interfaces:**
- Produces:
  - `csvField(value): string`
  - `buildTasksCsv(tasks: Task[]): string`
  - `buildCompletionsCsv(days: DayRecord[]): string`

- [ ] **Step 1: Write the failing test** (`__tests__/historyCsv.test.ts`):

```ts
import { buildCompletionsCsv, buildTasksCsv, csvField } from '../src/utils/historyCsv';
import { createCustomTask } from '../src/utils/taskFactory';
import { TaskFrequency } from '../src/types';

describe('history CSV', () => {
  it('escapes commas, quotes and newlines (RFC 4180)', () => {
    expect(csvField('plain')).toBe('plain');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('two\nlines')).toBe('"two\nlines"');
  });

  it('writes a header and one row per task', () => {
    const task = createCustomTask('Buy milk, eggs', '', 'Shopping', TaskFrequency.ONCE);
    const lines = buildTasksCsv([task]).trimEnd().split('\r\n');
    expect(lines[0]).toBe('name,category,frequency,priority,due_date,status');
    expect(lines[1].startsWith('"Buy milk, eggs",')).toBe(true);
    expect(lines).toHaveLength(2);
  });

  it('writes completions with local date and time, oldest first', () => {
    const day = new Date(2026, 9, 1).getTime();
    const csv = buildCompletionsCsv([
      {
        date: day, done: 2, recurringDone: 0, customDone: 0, highPriorityDone: 0, timersFinished: 0, scheduledAhead: 0,
        completions: [
          { name: 'Late', at: new Date(2026, 9, 1, 21, 5).getTime() },
          { name: 'Early', at: new Date(2026, 9, 1, 8, 0).getTime() },
        ],
      },
    ]);
    expect(csv).toBe('date,time,task\r\n2026-10-01,08:00,Early\r\n2026-10-01,21:05,Late\r\n');
  });
});
```

`createCustomTask(name, description, category, frequency, ...)` is the existing helper in `src/utils/taskFactory.ts`, the same one the existing tests use.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/historyCsv.test.ts`
Expected: FAIL. Module not found.

- [ ] **Step 3: Implement** `src/utils/historyCsv.ts`:

```ts
import { DayRecord, Task } from "../types";

export function csvField(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n";
}

const pad = (value: number) => String(value).padStart(2, "0");

function localDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildTasksCsv(tasks: Task[]): string {
  return toCsv([
    ["name", "category", "frequency", "priority", "due_date", "status"],
    ...tasks.map((task) => [task.name, task.category, task.frequency, task.priority, localDate(task.dueDate), task.status]),
  ]);
}

/** One row per logged completion (the save keeps up to 30 a day). */
export function buildCompletionsCsv(days: DayRecord[]): string {
  const completions = days
    .flatMap((day) => day.completions)
    .sort((left, right) => left.at - right.at);
  return toCsv([["date", "time", "task"], ...completions.map((item) => [localDate(item.at), localTime(item.at), item.name])]);
}
```

- [ ] **Step 4: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/historyCsv.ts __tests__/historyCsv.test.ts
git commit -m "feat(plus): history CSV builders with RFC 4180 escaping"
```

---

### Task 7: `adsService` behind an ads adapter

**Files:**
- Create: `src/services/adsService.ts`, `src/services/googleAdsClient.ts`, `src/constants/adConfig.ts`
- Test: `__tests__/adsService.test.ts`

**Interfaces:**
- Produces:
  - `AdResult = "earned" | "dismissed" | "unavailable"`
  - `interface AdsClient { ensureConsent(): Promise<boolean>; showRewarded(adUnitId: string): Promise<AdResult> }`
  - `createAdsService(client, adUnitId): { watchForReward(): Promise<AdResult> }`
  - `REWARDED_AD_UNIT_ID`
  - `googleAdsClient: AdsClient`

- [ ] **Step 1: Write the failing test** (`__tests__/adsService.test.ts`):

```ts
import { AdsClient, createAdsService } from '../src/services/adsService';

function fake(consent: boolean, result: 'earned' | 'dismissed' | 'unavailable'): AdsClient & { shown: number } {
  const client = {
    shown: 0,
    ensureConsent: async () => consent,
    showRewarded: async () => {
      client.shown += 1;
      return result;
    },
  };
  return client;
}

describe('adsService', () => {
  it('returns earned when the ad pays out', async () => {
    expect(await createAdsService(fake(true, 'earned'), 'unit').watchForReward()).toBe('earned');
  });

  it('dismissed (skipped early) gives no reward', async () => {
    expect(await createAdsService(fake(true, 'dismissed'), 'unit').watchForReward()).toBe('dismissed');
  });

  it('never shows an ad without consent', async () => {
    const client = fake(false, 'earned');
    expect(await createAdsService(client, 'unit').watchForReward()).toBe('unavailable');
    expect(client.shown).toBe(0);
  });

  it('maps a throwing client to unavailable', async () => {
    const client: AdsClient = {
      ensureConsent: async () => true,
      showRewarded: async () => {
        throw new Error('no fill');
      },
    };
    expect(await createAdsService(client, 'unit').watchForReward()).toBe('unavailable');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/adsService.test.ts`
Expected: FAIL. Module not found.

- [ ] **Step 3: Implement**

`src/services/adsService.ts`:

```ts
/** Rewarded ads (spec §2). The SDK sits behind AdsClient; googleAdsClient.ts is the only importer. */
export type AdResult = "earned" | "dismissed" | "unavailable";

export interface AdsClient {
  /** Shows the UMP consent form if required; true when ads may be requested. */
  ensureConsent(): Promise<boolean>;
  showRewarded(adUnitId: string): Promise<AdResult>;
}

export function createAdsService(client: AdsClient, adUnitId: string) {
  return {
    async watchForReward(): Promise<AdResult> {
      try {
        if (!(await client.ensureConsent())) return "unavailable";
        return await client.showRewarded(adUnitId);
      } catch {
        return "unavailable";
      }
    },
  };
}
```

`src/constants/adConfig.ts`:

```ts
/**
 * AdMob ids. These are Google's TEST ids until AdMob accepts Growra (it needs a public Play listing).
 * Swap BOTH this and the androidAppId in app.json; scripts/check-release-config.js warns while they're test ids.
 */
export const ADMOB_TEST_PUBLISHER = "ca-app-pub-3940256099942544";
export const REWARDED_AD_UNIT_ID = "ca-app-pub-3940256099942544/5224354917";
```

`src/services/googleAdsClient.ts`:

```ts
import mobileAds, { AdEventType, AdsConsent, RewardedAd, RewardedAdEventType } from "react-native-google-mobile-ads";
import { AdResult, AdsClient } from "./adsService";

const AD_TIMEOUT_MS = 15000;
let initialized = false;

export const googleAdsClient: AdsClient = {
  async ensureConsent() {
    await AdsConsent.requestInfoUpdate();
    await AdsConsent.loadAndShowConsentFormIfRequired();
    const info = await AdsConsent.getConsentInfo();
    if (!info.canRequestAds) return false;
    if (!initialized) {
      await mobileAds().initialize();
      initialized = true;
    }
    return true;
  },

  showRewarded(adUnitId) {
    return new Promise<AdResult>((resolve) => {
      const ad = RewardedAd.createForAdRequest(adUnitId);
      let earned = false;
      let settled = false;
      const finish = (result: AdResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        unsubscribers.forEach((unsubscribe) => unsubscribe());
        resolve(result);
      };
      const unsubscribers = [
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          clearTimeout(timer); // loaded in time; now wait for the user
          ad.show().catch(() => finish("unavailable"));
        }),
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        }),
        ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned ? "earned" : "dismissed")),
        ad.addAdEventListener(AdEventType.ERROR, () => finish("unavailable")),
      ];
      const timer = setTimeout(() => finish("unavailable"), AD_TIMEOUT_MS);
      ad.load();
    });
  },
};
```

- [ ] **Step 4: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: all pass. If `tsc` complains about an event or consent API name in 16.5.0, check `node_modules/react-native-google-mobile-ads/lib/typescript/index.d.ts` and adapt **only** `googleAdsClient.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/services/adsService.ts src/services/googleAdsClient.ts src/constants/adConfig.ts __tests__/adsService.test.ts
git commit -m "feat(ads): adsService with consent-first rewarded ads behind an AdsClient adapter"
```

---

### Task 8: Plus controller, the Plus sheet and the Settings wiring

**Files:**
- Create: `src/hooks/usePlusController.ts`, `src/components/GrowraPlusModal.tsx`
- Modify: `src/App.tsx`, `src/components/SettingsModal.tsx`, `src/constants/appCopy.ts` (the copy interface plus `en` and `pt`)
- Test: `__tests__/plusController.test.ts` (logic only)

**Interfaces:**
- Consumes: `createPlusService`, `expoIapClient`, `BuyResult` (Task 4); `resolveTheme`, `isPlusTheme` (Task 3); `buildTasksCsv`, `buildCompletionsCsv` (Task 6); `GameState.plus` (Task 2)
- Produces:
  - `applyPlusOwnership(state: GameState, owned: boolean, now: number): GameState`, a pure function that also resets a disallowed theme
  - `usePlusController(service: PlusService, onOwnedChange: (owned: boolean) => void)` → `{ price: string | null; busy: boolean; buy(): Promise<BuyResult>; restore(): Promise<RestoreResult> }`
  - `GrowraPlusModal` props `{ visible, settings, isPlus, price, busy, onBuy, onRestore, onClose }`

- [ ] **Step 1: Write the failing test** (`__tests__/plusController.test.ts`):

```ts
import { applyPlusOwnership } from '../src/hooks/usePlusController';
import { createInitialGameState } from '../src/utils/initialState';

describe('applyPlusOwnership', () => {
  it('sets owned and the check time', () => {
    const next = applyPlusOwnership(createInitialGameState(), true, 123);
    expect(next.plus).toEqual({ owned: true, lastCheckedAt: 123 });
  });

  it('falls back to mint when Plus is lost while a Plus theme is selected', () => {
    const base = createInitialGameState();
    const withDusk = { ...base, plus: { owned: true, lastCheckedAt: 1 }, settings: { ...base.settings, theme: 'dusk' as const } };
    const next = applyPlusOwnership(withDusk, false, 2);
    expect(next.plus.owned).toBe(false);
    expect(next.settings.theme).toBe('mint');
  });

  it('keeps a free theme untouched', () => {
    const base = createInitialGameState();
    const withOcean = { ...base, settings: { ...base.settings, theme: 'ocean' as const } };
    expect(applyPlusOwnership(withOcean, false, 2).settings.theme).toBe('ocean');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/plusController.test.ts`
Expected: FAIL. Module not found.

- [ ] **Step 3: Implement** `src/hooks/usePlusController.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { GameState } from "../types";
import { resolveTheme } from "../utils/plus";
import { BuyResult, PlusService, RestoreResult } from "../services/plusService";

/** Pure: record ownership; a Plus theme without Plus falls back to Mint. */
export function applyPlusOwnership(state: GameState, owned: boolean, now: number): GameState {
  const theme = resolveTheme(state.settings.theme, owned);
  return {
    ...state,
    plus: { owned, lastCheckedAt: now },
    settings: theme === state.settings.theme ? state.settings : { ...state.settings, theme },
  };
}

/**
 * Loads the price, re-checks ownership on start and foreground, and runs buy/restore.
 * "unavailable" never changes ownership, so Plus keeps working offline.
 */
export function usePlusController(service: PlusService, onOwnedChange: (owned: boolean) => void) {
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onOwnedChangeRef = useRef(onOwnedChange);
  onOwnedChangeRef.current = onOwnedChange;

  const restore = useCallback(async (): Promise<RestoreResult> => {
    const result = await service.restore();
    if (result !== "unavailable") onOwnedChangeRef.current(result === "owned");
    return result;
  }, [service]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const loadedPrice = await service.getPrice();
      if (alive) setPrice(loadedPrice);
      if (alive) await restore();
    })();
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") void restore();
    });
    return () => {
      alive = false;
      subscription.remove();
    };
  }, [service, restore]);

  const buy = useCallback(async (): Promise<BuyResult> => {
    setBusy(true);
    try {
      const result = await service.buy();
      if (result === "purchased") onOwnedChangeRef.current(true);
      return result;
    } finally {
      setBusy(false);
    }
  }, [service]);

  return { price, busy, buy, restore };
}
```

`src/constants/appCopy.ts`: add these keys to the copy interface and to both languages.

| key | en | pt |
|---|---|---|
| `plusTitle` | `Growra Plus` | `Growra Plus` |
| `plusPitch` | `A one-time unlock. No subscription.` | `Desbloqueio único. Sem subscrição.` |
| `plusPerkThemes` | `3 extra themes` | `3 temas extra` |
| `plusPerkHistory` | `Every past week on your Journey` | `Todas as semanas passadas na tua Jornada` |
| `plusPerkExport` | `Export your history (CSV)` | `Exportar o teu histórico (CSV)` |
| `plusPerkNoAds` | `No ads: exploring gives finds straight away` | `Sem anúncios: explorar dá achados logo` |
| `plusBuy` | `Unlock for {price}` | `Desbloquear por {price}` |
| `plusUnavailable` | `Store unavailable, try again later` | `Loja indisponível, tenta mais tarde` |
| `plusRestore` | `Restore purchase` | `Restaurar compra` |
| `plusThanks` | `Thanks! Plus is unlocked.` | `Obrigado! O Plus está desbloqueado.` |
| `plusPending` | `Payment pending. Plus unlocks once Google Play confirms it.` | `Pagamento pendente. O Plus desbloqueia quando o Google Play confirmar.` |
| `plusError` | `Something went wrong. Please try again.` | `Algo correu mal. Tenta outra vez.` |
| `plusRestored` | `Plus restored.` | `Plus restaurado.` |
| `plusNotFound` | `No purchase found on this Google account.` | `Nenhuma compra encontrada nesta conta Google.` |
| `plusOwned` | `Plus is active. Thank you for supporting Growra!` | `O Plus está ativo. Obrigado por apoiares o Growra!` |
| `plusBadge` | `Plus` | `Plus` |
| `settingsPlus` | `Growra Plus` | `Growra Plus` |
| `settingsExportCsv` | `Export your history (CSV)` | `Exportar o teu histórico (CSV)` |

`src/components/GrowraPlusModal.tsx`:

```tsx
import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

interface GrowraPlusModalProps {
  visible: boolean;
  settings: AppSettings;
  isPlus: boolean;
  price: string | null;
  busy: boolean;
  onBuy: () => void;
  onRestore: () => void;
  onClose: () => void;
}

export default function GrowraPlusModal({ visible, settings, isPlus, price, busy, onBuy, onRestore, onClose }: GrowraPlusModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const perks = [copy.plusPerkThemes, copy.plusPerkHistory, copy.plusPerkExport, copy.plusPerkNoAds];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>{copy.plusTitle}</Text>
          <Text style={[styles.pitch, { color: theme.mutedText }]}>{copy.plusPitch}</Text>
          {perks.map((perk) => (
            <Text key={perk} style={[styles.perk, { color: theme.text }]}>✓  {perk}</Text>
          ))}
          {isPlus ? (
            <Text style={[styles.owned, { color: theme.success }]}>{copy.plusOwned}</Text>
          ) : (
            <TouchableOpacity
              style={[styles.buy, { backgroundColor: price ? theme.accent : theme.border }]}
              onPress={onBuy}
              disabled={!price || busy}
            >
              {busy ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <Text style={[styles.buyText, { color: price ? theme.accentText : theme.mutedText }]}>
                  {price ? copy.plusBuy.replace("{price}", price) : copy.plusUnavailable}
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRestore} disabled={busy}>
            <Text style={[styles.link, { color: theme.accent }]}>{copy.plusRestore}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.link, { color: theme.mutedText }]}>{copy.journeyClose}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.45)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, gap: 10 },
  title: { fontSize: 22, fontWeight: "700" },
  pitch: { fontSize: 14, marginBottom: 6 },
  perk: { fontSize: 15 },
  owned: { fontSize: 15, fontWeight: "700", marginTop: 10 },
  buy: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  buyText: { fontSize: 16, fontWeight: "700" },
  link: { fontSize: 14, fontWeight: "600", textAlign: "center", paddingVertical: 6 },
});
```

`src/components/SettingsModal.tsx`:
- Add props `isPlus: boolean; onOpenPlus: () => void; onExportCsv: () => Promise<void>;`.
- In the theme list, import `isPlusTheme` and change the theme card. Add a badge under the theme name:

```tsx
{isPlusTheme(themeOption.id) && !isPlus && (
  <Text style={[styles.themeName, { color: theme.accent }]}>{copy.plusBadge}</Text>
)}
```

and change its `onPress` to:

```tsx
onPress={() => (isPlusTheme(themeOption.id) && !isPlus ? onOpenPlus() : onThemeChange(themeOption.id))}
```

- Add a new section (copy the existing `styles.section` markup) titled `copy.settingsPlus`, with two buttons:
  - one that calls `onOpenPlus`, labelled `copy.plusTitle`;
  - one labelled `copy.settingsExportCsv` that calls `onExportCsv()` when `isPlus` and `onOpenPlus()` otherwise.

`src/App.tsx`:
- Imports: `GrowraPlusModal`, `usePlusController`, `applyPlusOwnership`, `createPlusService`, `expoIapClient`, `resolveTheme`, `buildTasksCsv`, `buildCompletionsCsv`, `File, Paths` from `expo-file-system`, `* as Sharing` from `expo-sharing`.
- Module scope: `const plusService = createPlusService(expoIapClient);`
- Inside the component:

```tsx
  const [plusVisible, setPlusVisible] = useState(false);
  const plus = usePlusController(plusService, (owned) => {
    const gameState = gameStateRef.current;
    if (!gameState || gameState.plus.owned === owned) return;
    void persistGameState(applyPlusOwnership(gameState, owned, Date.now()));
  });
  const isPlus = gameState?.plus.owned ?? false;

  const handleBuyPlus = async () => {
    const copy = getAppCopy(gameStateRef.current?.settings.language ?? "en");
    const result = await plus.buy();
    if (result === "purchased") Alert.alert(copy.plusTitle, copy.plusThanks);
    if (result === "pending") Alert.alert(copy.plusTitle, copy.plusPending);
    if (result === "error") Alert.alert(copy.plusTitle, copy.plusError);
    if (result === "unavailable") Alert.alert(copy.plusTitle, copy.plusUnavailable);
  };

  const handleRestorePlus = async () => {
    const copy = getAppCopy(gameStateRef.current?.settings.language ?? "en");
    const result = await plus.restore();
    Alert.alert(copy.plusTitle, result === "owned" ? copy.plusRestored : result === "not-owned" ? copy.plusNotFound : copy.plusUnavailable);
  };

  const handleExportCsv = async () => {
    const gameState = gameStateRef.current;
    if (!gameState?.plus.owned) return;
    const tasksFile = new File(Paths.cache, "growra-tasks.csv");
    const completionsFile = new File(Paths.cache, "growra-completions.csv");
    tasksFile.write(buildTasksCsv(gameState.tasks));
    completionsFile.write(buildCompletionsCsv(gameState.days));
    await Sharing.shareAsync(tasksFile.uri, { mimeType: "text/csv", dialogTitle: "growra-tasks.csv" });
    await Sharing.shareAsync(completionsFile.uri, { mimeType: "text/csv", dialogTitle: "growra-completions.csv" });
  };
```

- Where `getAppTheme(gameState.settings.theme)` is used for the app shell, use `getAppTheme(resolveTheme(gameState.settings.theme, isPlus))`.
- Pass `isPlus`, `onOpenPlus={() => setPlusVisible(true)}` and `onExportCsv={handleExportCsv}` to `SettingsModal`.
- Render once, next to `SettingsModal`:

```tsx
        <GrowraPlusModal
          visible={plusVisible}
          settings={gameState.settings}
          isPlus={isPlus}
          price={plus.price}
          busy={plus.busy}
          onBuy={handleBuyPlus}
          onRestore={handleRestorePlus}
          onClose={() => setPlusVisible(false)}
        />
```

`expo-file-system` on SDK 54 exports the `File`/`Paths` API from `expo-file-system`. If `tsc` reports otherwise, use `import * as FileSystem from "expo-file-system/legacy"` with `FileSystem.writeAsStringAsync(FileSystem.cacheDirectory + name, csv)`.

- [ ] **Step 4: Run the tests and bundle**

Run:

```bash
npx tsc --noEmit && npx eslint src && npx jest && \
  npx expo export --platform android --output-dir /tmp/growra-export
```

Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePlusController.ts src/components/GrowraPlusModal.tsx src/App.tsx src/components/SettingsModal.tsx src/constants/appCopy.ts __tests__/plusController.test.ts
git commit -m "feat(plus): Plus sheet, purchase/restore wiring, Plus themes and CSV export in Settings"
```

---

### Task 9: Journey look-back gate and explore buttons

**Files:**
- Create: `src/components/ExploreButton.tsx`
- Modify: `src/screens/JourneyScreen.tsx`, `src/screens/CompanionsScreen.tsx`, `src/App.tsx`, `src/constants/appCopy.ts`

**Interfaces:**
- Consumes: `isLookBackVisible` (Task 3); `getExploreLeft`, `grantExploreFind` (Task 5); `createAdsService`, `googleAdsClient`, `REWARDED_AD_UNIT_ID` (Task 7); `getRoadPosition` (`src/utils/journey.ts`)
- Produces:
  - `ExploreButton` props `{ settings, companionName, left: number, isPlus: boolean, busy: boolean, onPress: () => void }`
  - `JourneyScreen` / `CompanionsScreen` new props `isPlus: boolean`, `exploreBusy: boolean`, `onExplore: () => void`, `onOpenPlus: () => void`

Copy keys for both languages:

| key | en | pt |
|---|---|---|
| `exploreButton` | `Send {name} exploring` | `Enviar {name} a explorar` |
| `exploreAdHint` | `Watch a short ad · {left} left today` | `Vê um anúncio curto · faltam {left} hoje` |
| `explorePlusHint` | `{left} left today` | `faltam {left} hoje` |
| `exploreDone` | `Back tomorrow` | `Volta amanhã` |
| `exploreFound` | `{name} brought back a {find}!` | `{name} trouxe um(a) {find}!` |
| `exploreNoAd` | `No ad available right now. Try again later.` | `Nenhum anúncio disponível agora. Tenta mais tarde.` |
| `journeyLookBackLocked` | `See this week with Plus` | `Vê esta semana com o Plus` |

- [ ] **Step 1: Implement `ExploreButton`** (`src/components/ExploreButton.tsx`):

```tsx
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

interface ExploreButtonProps {
  settings: AppSettings;
  companionName: string;
  left: number;
  isPlus: boolean;
  busy: boolean;
  onPress: () => void;
}

export default function ExploreButton({ settings, companionName, left, isPlus, busy, onPress }: ExploreButtonProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const disabled = left === 0 || busy;
  const hint = left === 0 ? copy.exploreDone : (isPlus ? copy.explorePlusHint : copy.exploreAdHint).replace("{left}", String(left));

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: disabled ? theme.surfaceMuted : theme.accentSoft, borderColor: theme.accent }]}
      onPress={onPress}
      disabled={disabled}
    >
      {busy ? (
        <ActivityIndicator color={theme.accent} />
      ) : (
        <>
          <Text style={[styles.title, { color: theme.text }]}>🧭 {copy.exploreButton.replace("{name}", companionName)}</Text>
          <Text style={[styles.hint, { color: theme.mutedText }]}>{hint}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 14, borderWidth: 2, padding: 12, alignItems: "center", gap: 2 },
  title: { fontSize: 15, fontWeight: "700" },
  hint: { fontSize: 12 },
});
```

- [ ] **Step 2: App handler** (`src/App.tsx`).

Imports: `createAdsService`, `googleAdsClient`, `REWARDED_AD_UNIT_ID`, `getExploreLeft`, `grantExploreFind`, `getActiveCompanion` (`src/utils/companions`). At module scope add `const adsService = createAdsService(googleAdsClient, REWARDED_AD_UNIT_ID);`, then:

```tsx
  const [exploreBusy, setExploreBusy] = useState(false);

  const handleExplore = async () => {
    const before = gameStateRef.current;
    if (!before || exploreBusy || getExploreLeft(before.explore, Date.now()) === 0) return;
    const copy = getAppCopy(before.settings.language);
    setExploreBusy(true);
    try {
      if (!before.plus.owned) {
        const result = await adsService.watchForReward();
        if (result !== "earned") {
          if (result === "unavailable") Alert.alert(copy.plusTitle, copy.exploreNoAd);
          return;
        }
      }
      const current = gameStateRef.current ?? before;
      const { state, find } = grantExploreFind(current, Date.now(), Math.random());
      if (!find) return;
      await persistGameState(state);
      const companion = getActiveCompanion(state);
      Alert.alert(
        "🧭",
        copy.exploreFound
          .replace("{name}", companion?.name ?? "Growra")
          .replace("{find}", copy.decorationNames[find.id] ?? find.id),
      );
    } finally {
      setExploreBusy(false);
    }
  };
```

Pass `isPlus`, `exploreBusy`, `onExplore={handleExplore}` and `onOpenPlus={() => setPlusVisible(true)}` to `JourneyScreen` and `CompanionsScreen`.

- [ ] **Step 3: Placements**
- **`CompanionsScreen`:** below the active companion card, render

```tsx
<ExploreButton
  settings={settings}
  companionName={active.name}
  left={getExploreLeft(gameState.explore, Date.now())}
  isPlus={isPlus}
  busy={exploreBusy}
  onPress={onExplore}
/>
```

only when there is an active companion (`getActiveCompanion(gameState)`).
- **`JourneyScreen`:** in `DecorationsModal`, render the same `ExploreButton` above the "Bag" section title; thread the new props through `DecorationsModal`.
- **Journey look-back gate:** in `CampModal`, compute

```ts
const campsReached = getRoadPosition(gameState.days).campsReached;
const lookBackVisible = isLookBackVisible(campIndex, campsReached, isPlus);
```

Show the existing look-back block only when `lookBackVisible`. Otherwise show a tappable card with `copy.journeyLookBackLocked` that calls `onOpenPlus`. Thread `isPlus` and `onOpenPlus` into `CampModal`.

- [ ] **Step 4: Run the tests and bundle**

Run:

```bash
npx tsc --noEmit && npx eslint src && npx jest && \
  npx expo export --platform android --output-dir /tmp/growra-export
```

Expected: all clean. Also confirm with `grep -rn "ExploreButton" src/screens` that nothing renders on `TasksScreen`, `TaskCalendarScreen` or `DashboardScreen`. Only `CompanionsScreen` and `JourneyScreen` may match.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExploreButton.tsx src/screens/JourneyScreen.tsx src/screens/CompanionsScreen.tsx src/App.tsx src/constants/appCopy.ts
git commit -m "feat(ads): explore button on Companions and Journey decorations, Plus-gated look-back cards"
```

---

### Task 10: Art for the explore-only finds

**Files:**
- Create: `assets/journey/decorations/{comet-shard,moonstone,rainbow-ribbon,firefly-jar}.png`
- Modify: `src/constants/journeyImages.ts` (`DECORATION_IMAGES`)

- [ ] **Step 1: Generate with Codex** (see the memory note `reference_codex_bridge`):

```bash
cd /mnt/HDD/Projects/Growra && codex exec --sandbox workspace-write "Make 4 decoration sprites for Growra's Journey, matching the existing ones in assets/journey/decorations/ (cute high-detail pixel art, soft glow; open shell.png and acorn.png for reference). Files: assets/journey/decorations/comet-shard.png (a small glowing comet shard with a sparkly tail), moonstone.png (a smooth pale moonstone with a crescent glint), rainbow-ribbon.png (a short ribbon in rainbow colours, tied in a bow), firefly-jar.png (a small glass jar with three glowing fireflies). 192x192 PNG, transparent, centred, small even margin, reviewed on magenta. Only those 4 files; no git."
```

- [ ] **Step 2: Review** each file on magenta at 192 px and at 40 px: transparent, centred, and in the same style as `shell.png`. Re-ask Codex for any that fail.

- [ ] **Step 3: Register** them in `DECORATION_IMAGES` in `src/constants/journeyImages.ts`:

```ts
  "comet-shard": require("../../assets/journey/decorations/comet-shard.png"),
  moonstone: require("../../assets/journey/decorations/moonstone.png"),
  "rainbow-ribbon": require("../../assets/journey/decorations/rainbow-ribbon.png"),
  "firefly-jar": require("../../assets/journey/decorations/firefly-jar.png"),
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx expo export --platform android --output-dir /tmp/growra-export`
Expected: the export succeeds, so all 4 `require`s resolve.

- [ ] **Step 5: Commit**

```bash
git add assets/journey/decorations src/constants/journeyImages.ts
git commit -m "art: four explore-only decoration sprites"
```

---

### Task 11: Release check for test ad IDs

**Files:**
- Create: `scripts/check-release-config.js`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Write the script** (`scripts/check-release-config.js`):

```js
#!/usr/bin/env node
// Warns (or with --strict fails) while Growra still ships Google's TEST AdMob ids.
// Swap BOTH app.json androidAppId and src/constants/adConfig.ts REWARDED_AD_UNIT_ID once AdMob accepts the app.
const fs = require('fs');
const path = require('path');
const TEST_PUBLISHER = 'ca-app-pub-3940256099942544';
const root = path.join(__dirname, '..');
const problems = [];
if (fs.readFileSync(path.join(root, 'app.json'), 'utf8').includes(TEST_PUBLISHER)) {
  problems.push('app.json: AdMob androidAppId is still the test id');
}
if (fs.readFileSync(path.join(root, 'src/constants/adConfig.ts'), 'utf8').includes(`REWARDED_AD_UNIT_ID = "${TEST_PUBLISHER}`)) {
  problems.push('adConfig.ts: REWARDED_AD_UNIT_ID is still the test unit');
}
if (problems.length === 0) {
  console.log('Release config OK: real AdMob ids.');
  process.exit(0);
}
problems.forEach((problem) => console.warn(`WARNING: ${problem}`));
if (process.argv.includes('--strict')) process.exit(1);
console.warn('(Fine for internal testing; `npm run check:release` fails on these.)');
```

- [ ] **Step 2: Add scripts** to `package.json`: `"check:config": "node scripts/check-release-config.js"` and `"check:release": "node scripts/check-release-config.js --strict"`.

- [ ] **Step 3: Verify**

Run: `npm run check:config; echo "exit $?"`, then `npm run check:release; echo "exit $?"`
Expected: two warnings, exit 0; then the same two warnings, exit 1.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-release-config.js package.json
git commit -m "chore(ads): release check that flags test AdMob ids"
```

---

### Task 12: The `growra-website` repo

**Files (new repo `/mnt/HDD/Projects/growra-website`):**
- Create: `index.html`, `privacy-policy.html`, `README.md`, `assets/` (`icon-192.png`, `favicon.png`, `feature.png`, `og-image.jpg`), `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: Scaffold** in the same shape as `shardmarch-website` (open its `index.html`, `privacy-policy.html` and `.github/workflows/` and mirror the structure and the manual-only `workflow_dispatch` trigger).
- **Assets:** copy them from Growra:
  - `assets/images/icon.png` resized to 192 px and 48 px
  - `Documents/store/play-feature-graphic.png`
  - `og-image.jpg`, a 1200×630 crop of the feature graphic
- **`index.html`:**
  - The title "Growra: a task app with a companion".
  - Three short sections: "Use it your way" (free-form tasks), "A companion that grows with you", and "A road made of your days".
  - The feature graphic.
  - Open Graph tags pointing at `https://pedro7161.github.io/growra-website/assets/og-image.jpg`.
  - A footer link to the privacy policy.
- **`privacy-policy.html`**, with its last-updated date, covering:
  - (a) Saves are stored only on the device. No account, no server.
  - (b) Purchases (Growra Plus) are processed by Google Play. Growra only learns whether you own Plus.
  - (c) Optional rewarded ads come from Google AdMob, which may use the advertising ID and device data. Consent is asked in the EEA and UK before any ad, and ads never load for Plus users.
  - (d) No analytics, no tracking SDKs, no data sold.
  - (e) Children: the app isn't directed at children under 13.
  - (f) Contact: through the Google Play Store listing.

  **No email address anywhere on the site.**

- [ ] **Step 2: Verify** that no email or contact address slipped in:

```bash
grep -rniE "@[a-z0-9-]+\.[a-z]|mailto" /mnt/HDD/Projects/growra-website --include=*.html
```

Expected: no matches.

- [ ] **Step 3: Create the repo and push.**

```bash
cd /mnt/HDD/Projects/growra-website && git init -q && git add -A && \
  git commit -qm "Growra website: landing page and privacy policy"
gh repo create pedro7161/growra-website --public --source=. --push
gh api -X POST repos/pedro7161/growra-website/pages -f build_type=workflow
```

Running the deploy workflow is a release action. **Ask the user before running it.**

- [ ] **Step 4: Point the app at it.** In Growra, add a "Privacy policy" link to the `SettingsModal` Plus section that opens `https://pedro7161.github.io/growra-website/privacy-policy.html` with `Linking.openURL`. Add `settingsPrivacy` to the copy: en "Privacy policy", pt "Política de privacidade".

Run: `npx tsc --noEmit && npx jest`
Expected: clean.

Then commit in Growra: `git commit -am "feat: privacy policy link in Settings"`.

---

### Task 13: Release on internal testing

**Files:**
- Modify: `app.json` (`version` 1.7.0, `versionCode` +1), `package.json` (`version`), `src/constants/changelog.ts` (en and pt entries)

- [ ] **Step 1: Developer gate.** Confirm with the user that the Play Console **payments profile** exists and their account is a **license tester**. Without the payments profile, Play refuses to create the product.
- [ ] **Step 2: Create the product.** Use the Play MCP `onetime_products_create` for `com.growra.app`:
  - id `growra_plus`
  - title "Growra Plus"
  - a short description
  - price €0.99 EUR, other regions converted with `monetization_convert_region_prices`

  Then activate its purchase option. The price is the user's decision: already approved at €0.99.
- [ ] **Step 3: Bump the version and changelog.**
  - en: "Growra Plus: a one-time unlock with 3 extra themes, every past week on your Journey, CSV export, and no ads." and "Send your companion exploring for a decoration, twice a day."
  - pt: the same in pt-PT.

Run: `npx tsc --noEmit && npx eslint src && npx jest && npm run check:config`
Expected: clean (the ad-id warnings are expected).

- [ ] **Step 4: Build and upload.**
  - Merge to `main`, then run `npx eas-cli build -p android --profile production --non-interactive --no-wait`.
  - When the build is finished: Play MCP `edits_insert` → `bundles_upload` → `tracks_update` on `internal`, with pt-PT notes under 500 characters → `edits_validate` → `edits_commit`.
- [ ] **Step 5: Device test, with the user as a license tester.**
  1. Buy Plus. The license-tester sheet charges nothing.
  2. Check that the themes, old look-back cards and CSV export work.
  3. Uninstall, reinstall, and confirm Plus restores itself.
  4. On a non-Plus state, the explore button shows a Google test ad and then a find. After 2 finds it reads "Back tomorrow".
  5. With airplane mode on, Plus stays active.
