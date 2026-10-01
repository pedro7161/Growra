# Companion rooms, phase 1: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every companion a room (plus 3 Plus rooms) that the player decorates freely. Items can be moved, resized, flipped and layered, with undo. Rooms are stocked from a coin Room shop (with Plus Japanese and seasonal sets) and shared as a 1080×1350 picture.

**Architecture:** All room rules are pure functions over `GameState`, in `src/utils/roomCatalog.ts`, `src/utils/rooms.ts` and `src/utils/roomShop.ts`, and Jest-tested. `syncRooms()` is idempotent and runs on every persist and load. It creates companion rooms and Plus rooms, and strips Plus content when Plus is lost. The UI is a full-screen `RoomEditorScreen` built from absolutely-positioned `Image` views (`RoomCanvas` / `RoomItemView`), with `react-native-gesture-handler` + `reanimated` gestures. Sharing captures the canvas with `react-native-view-shot`.

**Tech stack:** Expo SDK 54, React Native 0.81, TypeScript, Jest (ts-jest, `TZ=Europe/Lisbon`), `react-native-gesture-handler ~2.28`, `react-native-reanimated ~4.1`, `react-native-view-shot 4.0.3` (new), `expo-sharing`.

**Spec:** `docs/superpowers/specs/2026-10-01-companion-rooms-design.md` (phase 1 only; phase 2 is room codes, QR and ghosts, with its own plan).

**Branch:** `feat/companion-rooms`, cut from `feat/growra-plus`. Rooms need `GameState.plus`, `resolveTheme`, `usePlusController` and the Plus sheet, and Plus isn't merged yet. Rebase onto `main` once PR #26 is merged.

## Global constraints

- **Coins and Plus buy looks, never progress:** no room action changes Bond, XP, streaks, usage or companions.
- **One place per decoration:** a decoration is in exactly one place, the bag, a camp spot or a room. A companion appears **at most once per room**.
- **30 items per room**, companions included. Scale is clamped to **0.5–1.5**. Move is clamped so **at least 25%** of the item stays inside the canvas.
- **Canvas** is always **4:5**. The shared picture is **1080×1350**.
- **Rooms:** one per companion, created automatically. **3 extra rooms with Plus**, hidden (not deleted) without Plus. When Plus is lost, Plus-room decorations and Plus-set items return to the bag, and Plus-set styles fall back to the starter.
- **Furniture** can only go in rooms. Camp items can go in rooms or camps.
- **Plus sets:**
  - **Japanese:** always available.
  - **Event sets:** buyable only in season.
    - **Halloween:** 15 Oct – 2 Nov.
    - **Christmas:** 1 Dec – 6 Jan.
    - **Valentine's:** 1–15 Feb.
    - **Easter:** Easter Sunday ±7 days.
  - Once bought, they're kept forever and placeable any time while Plus is active.
- **Footer:** "Made with Growra" on shared pictures. Plus players can switch it off.
- **Copy:** every user-facing string is in **en and pt** in `src/constants/appCopy.ts`.
- **No new bottom tab.** Entry is from the Companions screen.
- **Before every commit:** `npx tsc --noEmit` clean and `npx jest` all green.

## Review focus

1. **A decoration is placed in a room, then the player opens a camp:** it must not show in the camp's bag, and it must not be placeable in two places. Pinned in Task 4 (`decoration in a room is not in the camp bag` and `isPlaced is true for room decorations`).
2. **A companion is removed from the save, or a decoration disappears (old save, import):** the room must drop the dangling item, not crash rendering. Pinned in Task 4 (`syncRooms drops items whose ref no longer exists`).
3. **Christmas window across New Year, and Easter on different dates each year:** the set must be buyable on 3 Jan and not on 7 Jan, and Easter must be right for 2026 (5 Apr) and 2027 (28 Mar). Pinned in Task 3.
4. **Plus is lost while Plus furniture sits in a companion room:** the item returns to the bag and the room still renders. When Plus returns, the item is still owned. Pinned in Task 4 (`syncRooms strips Plus content without Plus`).
5. **The old shop path can buy furniture or Plus items:** `buyDecoration` (camp shop) must refuse furniture, so season and Plus gates can't be bypassed. Pinned in Task 3 (`camp shop refuses furniture`).

---

### Task 1: The capture library and a native build check

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install**

```bash
cd /mnt/HDD/Projects/Growra
npx expo install react-native-view-shot
```

Expected: `react-native-view-shot@4.0.3` in `package.json`.

- [ ] **Step 2: Native build check** (`android/` is gitignored; `android/local.properties` needs `sdk.dir=/home/pedro7161/Android/Sdk`):

```bash
npx expo prebuild -p android --no-install && echo "sdk.dir=/home/pedro7161/Android/Sdk" > android/local.properties
cd android && ./gradlew :app:assembleDebug -q && cd ..
```

Expected: `android/app/build/outputs/apk/debug/app-debug.apk` exists. If the build fails on Kotlin metadata, pin the newest `react-native-view-shot` version whose Android code compiles with Kotlin 2.1, as was done for the ads library (see the Plus ledger).

- [ ] **Step 3: Verify the JS side**

Run: `npx tsc --noEmit && npx jest`
Expected: clean; all tests pass (84).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(rooms): add react-native-view-shot"
```

---

### Task 2: Room types, save fields and migration

**Files:**
- Modify: `src/types/index.ts`, `src/utils/initialState.ts`, `src/services/gameStateService.ts`
- Test: `__tests__/gameStateService.test.ts`

**Interfaces:**
- Produces:
  - `RoomItem { id; kind: "decoration" | "companion"; ref: string; x: number; y: number; scale: number; flip: boolean }`
  - `Room { id; ownerPetId: string | null; name: string; styleId: string; items: RoomItem[] }`
  - `Decoration.roomId?: string`
  - `GameState.rooms: Room[]`, `GameState.ownedRoomStyles: string[]`, `GameState.roomShareFooter: boolean`

- [ ] **Step 1: Write the failing test** (append to `__tests__/gameStateService.test.ts`):

```ts
describe('room state', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts a new game with no rooms, the starter style and the footer on', () => {
    const state = createInitialGameState();
    expect(state.rooms).toEqual([]);
    expect(state.ownedRoomStyles).toEqual(['wooden-bedroom']);
    expect(state.roomShareFooter).toBe(true);
  });

  it('migrates an older save without room fields', async () => {
    const legacy = createSaveData(createInitialGameState()) as any;
    delete legacy.gameState.rooms;
    delete legacy.gameState.ownedRoomStyles;
    delete legacy.gameState.roomShareFooter;
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(legacy));
    const result = await gameStateService.loadGame();
    if (result.status !== 'loaded') throw new Error('not loaded');
    expect(result.saveData.gameState.rooms).toEqual([]);
    expect(result.saveData.gameState.ownedRoomStyles).toEqual(['wooden-bedroom']);
    expect(result.saveData.gameState.roomShareFooter).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/gameStateService.test.ts`
Expected: FAIL (TS2339: `rooms` does not exist on `GameState`).

- [ ] **Step 3: Implement**

`src/types/index.ts`, before `export interface GameState`:

```ts
// A placed thing in a companion room (spec §1). Position is the item's centre as a fraction of the 4:5 canvas.
export interface RoomItem {
  id: string;
  kind: "decoration" | "companion";
  ref: string; // decoration instance id, or pet id
  x: number;
  y: number;
  scale: number; // 0.5..1.5
  flip: boolean;
}

// ownerPetId null = a Plus extra room. items order = layer order (last = front).
export interface Room {
  id: string;
  ownerPetId: string | null;
  name: string; // "" = the default name
  styleId: string;
  items: RoomItem[];
}
```

In `interface Decoration` add, after `spot: number;`:

```ts
  roomId?: string; // set while the decoration is in a room
```

In `GameState` add, after `explore: ExploreState;`:

```ts
  rooms: Room[];
  ownedRoomStyles: string[];
  roomShareFooter: boolean;
```

`src/utils/initialState.ts` `createInitialGameState()`, after `explore: ...,`:

```ts
    rooms: [],
    ownedRoomStyles: ["wooden-bedroom"],
    roomShareFooter: true,
```

`src/services/gameStateService.ts`:
- Add `| "rooms" | "ownedRoomStyles" | "roomShareFooter"` to the `PersistedGameState` `Omit` union.
- Add `rooms?: Room[]; ownedRoomStyles?: string[]; roomShareFooter?: boolean;` to its `& {}` part, importing `Room` from `../types`.
- In `migrateSaveData` `migratedGameState`, after `explore: ...,`:

```ts
    rooms: saveData.gameState.rooms ?? [],
    ownedRoomStyles: saveData.gameState.ownedRoomStyles ?? ["wooden-bedroom"],
    roomShareFooter: saveData.gameState.roomShareFooter ?? true,
```

- [ ] **Step 4: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/utils/initialState.ts src/services/gameStateService.ts __tests__/gameStateService.test.ts
git commit -m "feat(rooms): room types and save fields with migration"
```

---

### Task 3: Room catalog, seasons, and the camp shop guard

**Files:**
- Create: `src/utils/roomCatalog.ts`
- Modify: `src/utils/journey.ts` (`DecorationType`, `DECORATION_TYPES`, `buyDecoration`), `src/constants/appCopy.ts` (`decorationNames` en/pt, plus `roomStyleNames` en/pt)
- Test: `__tests__/roomCatalog.test.ts`

**Interfaces:**
- Produces:
  - `RoomSetId = "japanese" | "halloween" | "christmas" | "valentines" | "easter"`
  - `RoomStyle { id: string; price: number; set?: RoomSetId }`
  - `STARTER_ROOM_STYLE = "wooden-bedroom"`
  - `ROOM_STYLES: RoomStyle[]`
  - `getRoomStyle(id): RoomStyle | undefined`
  - `easterSunday(year: number): Date`
  - `isSetInSeason(set: RoomSetId, now: number): boolean`
  - `getSetSeasonStartMonth(set: RoomSetId, year: number): number` (0–11)
  - `isFurniture(type): boolean`
  - `getRoomItemSize(typeId: string): number`, a fraction of canvas width
  - New `DecorationType` fields: `category?: "camp" | "furniture"; set?: RoomSetId; roomSize?: number`

- [ ] **Step 1: Write the failing test** (`__tests__/roomCatalog.test.ts`):

```ts
import {
  ROOM_STYLES,
  STARTER_ROOM_STYLE,
  easterSunday,
  getRoomItemSize,
  isFurniture,
  isSetInSeason,
} from '../src/utils/roomCatalog';
import { DECORATION_TYPES, buyDecoration, getDecorationType } from '../src/utils/journey';
import { createInitialGameState } from '../src/utils/initialState';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();

describe('room catalog', () => {
  it('has a free starter, 5 coin styles and 5 set styles', () => {
    expect(ROOM_STYLES.find((s) => s.id === STARTER_ROOM_STYLE)?.price).toBe(0);
    expect(ROOM_STYLES.filter((s) => !s.set && s.price > 0)).toHaveLength(5);
    expect(new Set(ROOM_STYLES.filter((s) => s.set).map((s) => s.set))).toEqual(
      new Set(['japanese', 'halloween', 'christmas', 'valentines', 'easter']),
    );
  });

  it('marks furniture and gives every furniture item a room size', () => {
    const furniture = DECORATION_TYPES.filter(isFurniture);
    expect(furniture.length).toBeGreaterThanOrEqual(16 + 24);
    furniture.forEach((type) => expect(type.roomSize).toBeGreaterThan(0));
    expect(isFurniture(getDecorationType('shell')!)).toBe(false);
    expect(getRoomItemSize('shell')).toBe(0.2);
  });

  it('computes Easter Sunday', () => {
    expect(easterSunday(2026).toDateString()).toBe(new Date(2026, 3, 5).toDateString());
    expect(easterSunday(2027).toDateString()).toBe(new Date(2027, 2, 28).toDateString());
  });

  it('keeps Japanese always in season and events only in their windows', () => {
    expect(isSetInSeason('japanese', at(2026, 7, 1))).toBe(true);
    expect(isSetInSeason('halloween', at(2026, 10, 20))).toBe(true);
    expect(isSetInSeason('halloween', at(2026, 11, 3))).toBe(false);
    expect(isSetInSeason('christmas', at(2026, 12, 1))).toBe(true);
    expect(isSetInSeason('christmas', at(2027, 1, 3))).toBe(true);
    expect(isSetInSeason('christmas', at(2027, 1, 7))).toBe(false);
    expect(isSetInSeason('valentines', at(2027, 2, 14))).toBe(true);
    expect(isSetInSeason('valentines', at(2027, 2, 16))).toBe(false);
    expect(isSetInSeason('easter', at(2027, 3, 21))).toBe(true);
    expect(isSetInSeason('easter', at(2027, 4, 5))).toBe(false);
  });

  it('camp shop refuses furniture', () => {
    const state = { ...createInitialGameState(), coins: 10000 };
    const bed = DECORATION_TYPES.find(isFurniture)!;
    expect(buyDecoration(state, bed.id)).toBe(state);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/roomCatalog.test.ts`
Expected: FAIL (cannot find module `../src/utils/roomCatalog`).

- [ ] **Step 3: Implement**

In `src/utils/journey.ts`:
- Extend `DecorationType`:

```ts
  /** "furniture" can only go in rooms; undefined = an outdoor camp item (rooms or camps). */
  category?: "camp" | "furniture";
  /** Plus set this item belongs to (rooms spec §1). */
  set?: "japanese" | "halloween" | "christmas" | "valentines" | "easter";
  /** Drawn width in a room as a fraction of the canvas width; default 0.2. */
  roomSize?: number;
```

- Append to `DECORATION_TYPES`:

```ts
  // Room furniture (rooms spec §1, §4)
  { id: "bed", icon: "🛏️", price: 120, category: "furniture", roomSize: 0.45 },
  { id: "rug", icon: "🟫", price: 80, category: "furniture", roomSize: 0.5 },
  { id: "bookshelf", icon: "📚", price: 120, category: "furniture", roomSize: 0.3 },
  { id: "window", icon: "🪟", price: 100, category: "furniture", roomSize: 0.3 },
  { id: "floor-lamp", icon: "💡", price: 80, category: "furniture", roomSize: 0.18 },
  { id: "potted-plant", icon: "🪴", price: 60, category: "furniture", roomSize: 0.18 },
  { id: "round-table", icon: "🪑", price: 90, category: "furniture", roomSize: 0.3 },
  { id: "armchair", icon: "🛋️", price: 110, category: "furniture", roomSize: 0.3 },
  { id: "cushion", icon: "🟣", price: 40, category: "furniture", roomSize: 0.15 },
  { id: "painting", icon: "🖼️", price: 70, category: "furniture", roomSize: 0.22 },
  { id: "wall-clock", icon: "🕰️", price: 70, category: "furniture", roomSize: 0.15 },
  { id: "toy-chest", icon: "🧸", price: 90, category: "furniture", roomSize: 0.25 },
  { id: "desk", icon: "🗄️", price: 110, category: "furniture", roomSize: 0.35 },
  { id: "beanbag", icon: "🫘", price: 70, category: "furniture", roomSize: 0.25 },
  { id: "fairy-lights", icon: "✨", price: 60, category: "furniture", roomSize: 0.4 },
  { id: "plant-shelf", icon: "🌿", price: 90, category: "furniture", roomSize: 0.28 },
  // Plus: Japanese
  { id: "low-table", icon: "🍵", price: 100, category: "furniture", set: "japanese", roomSize: 0.35 },
  { id: "futon", icon: "🛏️", price: 120, category: "furniture", set: "japanese", roomSize: 0.45 },
  { id: "paper-lamp", icon: "🏮", price: 80, category: "furniture", set: "japanese", roomSize: 0.18 },
  { id: "bonsai", icon: "🌳", price: 90, category: "furniture", set: "japanese", roomSize: 0.2 },
  { id: "folding-screen", icon: "🎎", price: 110, category: "furniture", set: "japanese", roomSize: 0.4 },
  { id: "zabuton", icon: "🟥", price: 50, category: "furniture", set: "japanese", roomSize: 0.15 },
  // Plus: Halloween
  { id: "pumpkins", icon: "🎃", price: 80, category: "furniture", set: "halloween", roomSize: 0.22 },
  { id: "ghost-lamp", icon: "👻", price: 90, category: "furniture", set: "halloween", roomSize: 0.18 },
  { id: "cauldron", icon: "🫕", price: 100, category: "furniture", set: "halloween", roomSize: 0.25 },
  { id: "spider-web", icon: "🕸️", price: 60, category: "furniture", set: "halloween", roomSize: 0.3 },
  { id: "candles", icon: "🕯️", price: 60, category: "furniture", set: "halloween", roomSize: 0.15 },
  // Plus: Christmas
  { id: "xmas-tree", icon: "🎄", price: 120, category: "furniture", set: "christmas", roomSize: 0.35 },
  { id: "presents", icon: "🎁", price: 80, category: "furniture", set: "christmas", roomSize: 0.22 },
  { id: "stockings", icon: "🧦", price: 60, category: "furniture", set: "christmas", roomSize: 0.2 },
  { id: "wreath", icon: "💚", price: 70, category: "furniture", set: "christmas", roomSize: 0.2 },
  { id: "snow-globe", icon: "🔮", price: 90, category: "furniture", set: "christmas", roomSize: 0.15 },
  // Plus: Valentine's
  { id: "heart-balloons", icon: "🎈", price: 80, category: "furniture", set: "valentines", roomSize: 0.25 },
  { id: "rose-vase", icon: "🌹", price: 70, category: "furniture", set: "valentines", roomSize: 0.15 },
  { id: "love-letter-box", icon: "💌", price: 60, category: "furniture", set: "valentines", roomSize: 0.18 },
  { id: "cake-stand", icon: "🎂", price: 90, category: "furniture", set: "valentines", roomSize: 0.2 },
  // Plus: Easter
  { id: "egg-basket", icon: "🧺", price: 80, category: "furniture", set: "easter", roomSize: 0.2 },
  { id: "bunny-plush", icon: "🐰", price: 90, category: "furniture", set: "easter", roomSize: 0.2 },
  { id: "flower-crate", icon: "🌷", price: 70, category: "furniture", set: "easter", roomSize: 0.25 },
  { id: "egg-garland", icon: "🥚", price: 60, category: "furniture", set: "easter", roomSize: 0.4 },
```

- In `buyDecoration`, change the guard to:

```ts
  if (!type || type.price <= 0 || type.category === "furniture" || gameState.coins < type.price) {
```

`src/utils/roomCatalog.ts`:

```ts
import { DecorationType, getDecorationType } from "./journey";

export type RoomSetId = "japanese" | "halloween" | "christmas" | "valentines" | "easter";

export interface RoomStyle {
  id: string;
  price: number; // coins; 0 = free
  set?: RoomSetId; // Plus set
}

export const STARTER_ROOM_STYLE = "wooden-bedroom";

export const ROOM_STYLES: RoomStyle[] = [
  { id: STARTER_ROOM_STYLE, price: 0 },
  { id: "greenhouse", price: 150 },
  { id: "starry-attic", price: 150 },
  { id: "beach-hut", price: 150 },
  { id: "library", price: 200 },
  { id: "mushroom-cottage", price: 200 },
  { id: "japanese-room", price: 250, set: "japanese" },
  { id: "spooky-attic", price: 200, set: "halloween" },
  { id: "snowy-cabin", price: 200, set: "christmas" },
  { id: "pastel-cafe", price: 200, set: "valentines" },
  { id: "spring-garden", price: 200, set: "easter" },
];

export const DEFAULT_ROOM_ITEM_SIZE = 0.2;

export function getRoomStyle(id: string): RoomStyle | undefined {
  return ROOM_STYLES.find((style) => style.id === id);
}

export function isFurniture(type: DecorationType): boolean {
  return type.category === "furniture";
}

export function getRoomItemSize(typeId: string): number {
  return getDecorationType(typeId)?.roomSize ?? DEFAULT_ROOM_ITEM_SIZE;
}

/** Anonymous Gregorian computus; returns local midnight of Easter Sunday. */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Is `now` (local) inside the set's buying window? Japanese is always available. */
export function isSetInSeason(set: RoomSetId, now: number): boolean {
  const date = new Date(now);
  const year = date.getFullYear();
  const t = dayStart(date);
  const between = (from: Date, to: Date) => t >= dayStart(from) && t <= dayStart(to);
  switch (set) {
    case "japanese":
      return true;
    case "halloween":
      return between(new Date(year, 9, 15), new Date(year, 10, 2));
    case "christmas":
      return between(new Date(year, 11, 1), new Date(year, 11, 31)) || between(new Date(year, 0, 1), new Date(year, 0, 6));
    case "valentines":
      return between(new Date(year, 1, 1), new Date(year, 1, 15));
    case "easter": {
      const easter = easterSunday(year);
      const from = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 7);
      const to = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 7);
      return between(from, to);
    }
  }
}

/** Month (0-11) the set's window starts, for "Returns in {month}". */
export function getSetSeasonStartMonth(set: RoomSetId, year: number): number {
  switch (set) {
    case "japanese":
      return 0;
    case "halloween":
      return 9;
    case "christmas":
      return 11;
    case "valentines":
      return 1;
    case "easter": {
      const easter = easterSunday(year);
      return new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 7).getMonth();
    }
  }
}
```

`src/constants/appCopy.ts`:
- `decorationNames`, en: `bed: "bed", rug: "rug", bookshelf: "bookshelf", window: "window", "floor-lamp": "floor lamp", "potted-plant": "potted plant", "round-table": "round table", armchair: "armchair", cushion: "cushion", painting: "painting", "wall-clock": "wall clock", "toy-chest": "toy chest", desk: "desk", beanbag: "beanbag", "fairy-lights": "fairy lights", "plant-shelf": "plant shelf", "low-table": "low table", futon: "futon", "paper-lamp": "paper lamp", bonsai: "bonsai", "folding-screen": "folding screen", zabuton: "zabuton cushion", pumpkins: "pumpkins", "ghost-lamp": "ghost lamp", cauldron: "cauldron", "spider-web": "spider web", candles: "candles", "xmas-tree": "Christmas tree", presents: "presents", stockings: "stockings", wreath: "wreath", "snow-globe": "snow globe", "heart-balloons": "heart balloons", "rose-vase": "rose vase", "love-letter-box": "love-letter box", "cake-stand": "cake stand", "egg-basket": "egg basket", "bunny-plush": "bunny plush", "flower-crate": "flower crate", "egg-garland": "egg garland"`.
- `decorationNames`, pt: `bed: "cama", rug: "tapete", bookshelf: "estante", window: "janela", "floor-lamp": "candeeiro de pé", "potted-plant": "vaso com planta", "round-table": "mesa redonda", armchair: "poltrona", cushion: "almofada", painting: "quadro", "wall-clock": "relógio de parede", "toy-chest": "baú de brinquedos", desk: "secretária", beanbag: "puff", "fairy-lights": "luzinhas", "plant-shelf": "prateleira de plantas", "low-table": "mesa baixa", futon: "futon", "paper-lamp": "candeeiro de papel", bonsai: "bonsai", "folding-screen": "biombo", zabuton: "almofada zabuton", pumpkins: "abóboras", "ghost-lamp": "candeeiro fantasma", cauldron: "caldeirão", "spider-web": "teia de aranha", candles: "velas", "xmas-tree": "árvore de Natal", presents: "presentes", stockings: "meias de Natal", wreath: "coroa de Natal", "snow-globe": "globo de neve", "heart-balloons": "balões de coração", "rose-vase": "jarra de rosas", "love-letter-box": "caixa de cartas de amor", "cake-stand": "suporte de bolo", "egg-basket": "cesto de ovos", "bunny-plush": "coelhinho de peluche", "flower-crate": "caixa de flores", "egg-garland": "grinalda de ovos"`.
- New key `roomStyleNames: Record<string, string>`, en: `"wooden-bedroom": "Wooden bedroom", greenhouse: "Greenhouse", "starry-attic": "Starry attic", "beach-hut": "Beach hut", library: "Library", "mushroom-cottage": "Mushroom cottage", "japanese-room": "Japanese room", "spooky-attic": "Spooky attic", "snowy-cabin": "Snowy cabin", "pastel-cafe": "Pastel café", "spring-garden": "Spring garden"`.
- `roomStyleNames`, pt: `"wooden-bedroom": "Quarto de madeira", greenhouse: "Estufa", "starry-attic": "Sótão estrelado", "beach-hut": "Cabana de praia", library: "Biblioteca", "mushroom-cottage": "Casinha cogumelo", "japanese-room": "Quarto japonês", "spooky-attic": "Sótão assustador", "snowy-cabin": "Cabana nevada", "pastel-cafe": "Café pastel", "spring-garden": "Jardim de primavera"`.

- [ ] **Step 4: Keep furniture out of the camps** (no new test needed; Task 4 covers the camp bag). In `src/screens/JourneyScreen.tsx`:
  - `DecorationsModal`'s shop lists `DECORATION_TYPES.filter((type) => type.category !== "furniture")`.
  - `CampModal`'s `bag` filter also excludes furniture:

    ```ts
    const bag = gameState.decorations.filter(
      (decoration) => !isPlaced(decoration) && getDecorationType(decoration.typeId)?.category !== "furniture",
    );
    ```

- [ ] **Step 5: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/roomCatalog.ts src/utils/journey.ts src/constants/appCopy.ts src/screens/JourneyScreen.tsx __tests__/roomCatalog.test.ts
git commit -m "feat(rooms): room styles, furniture and Plus sets with season windows; camp shop refuses furniture"
```

---

### Task 4: Room operations and `syncRooms`

**Files:**
- Create: `src/utils/rooms.ts`
- Modify: `src/utils/journey.ts` (`isPlaced`)
- Test: `__tests__/rooms.test.ts`

**Interfaces:**
- Consumes:
  - `Room`, `RoomItem`, `GameState.rooms/ownedRoomStyles` (Task 2)
  - `STARTER_ROOM_STYLE`, `getRoomStyle`, `getRoomItemSize`, `isFurniture` (Task 3)
  - `generateId` (`src/utils/idUtils`)
- Produces:
  - `MAX_ROOM_ITEMS = 30`, `PLUS_ROOM_COUNT = 3`, `MIN_ITEM_SCALE = 0.5`, `MAX_ITEM_SCALE = 1.5`, `COMPANION_ROOM_SIZE = 0.32`, `CANVAS_ASPECT = 1.25` (height/width)
  - `syncRooms(state: GameState): GameState`
  - `getVisibleRooms(state: GameState): Room[]`
  - `getRoomBag(state: GameState): Decoration[]`
  - `getItemSize(state: GameState, item: RoomItem): number`
  - `clampItemPosition(x: number, y: number, size: number): { x: number; y: number }`
  - `addDecorationToRoom(state, roomId, decorationId): GameState`
  - `addCompanionToRoom(state, roomId, petId): GameState`
  - `moveRoomItem(state, roomId, itemId, x, y): GameState`
  - `resizeRoomItem(state, roomId, itemId, scale): GameState`
  - `flipRoomItem(state, roomId, itemId): GameState`
  - `bringItemForward(state, roomId, itemId): GameState`
  - `sendItemBack(state, roomId, itemId): GameState`
  - `removeRoomItem(state, roomId, itemId): GameState`
  - `renameRoom(state, roomId, name): GameState`
  - `setRoomStyle(state, roomId, styleId): GameState`
  - `replaceRoom(state, room): GameState`

- [ ] **Step 1: Write the failing test** (`__tests__/rooms.test.ts`):

```ts
import {
  MAX_ROOM_ITEMS,
  PLUS_ROOM_COUNT,
  addCompanionToRoom,
  addDecorationToRoom,
  bringItemForward,
  clampItemPosition,
  flipRoomItem,
  getRoomBag,
  getVisibleRooms,
  moveRoomItem,
  removeRoomItem,
  resizeRoomItem,
  sendItemBack,
  setRoomStyle,
  syncRooms,
} from '../src/utils/rooms';
import { isPlaced } from '../src/utils/journey';
import { createInitialGameState } from '../src/utils/initialState';
import { createCompanion } from '../src/utils/gameplay';
import { GameState } from '../src/types';

function withPets(...templateIds: string[]): GameState {
  return syncRooms({ ...createInitialGameState(), pets: templateIds.map((id) => createCompanion(id)) });
}

function withDecoration(state: GameState, typeId: string): GameState {
  return { ...state, decorations: [...state.decorations, { id: `d-${typeId}-${state.decorations.length}`, typeId, camp: -1, spot: -1 }] };
}

describe('syncRooms', () => {
  it('creates one room per companion with the starter style', () => {
    const state = withPets('sprout', 'ripple');
    expect(state.rooms).toHaveLength(2);
    expect(state.rooms.map((room) => room.ownerPetId).sort()).toEqual(state.pets.map((pet) => pet.id).sort());
    state.rooms.forEach((room) => expect(room.styleId).toBe('wooden-bedroom'));
  });

  it('returns the same object when nothing changes', () => {
    const state = withPets('sprout');
    expect(syncRooms(state)).toBe(state);
  });

  it('adds 3 Plus rooms with Plus and hides them without', () => {
    const base = withPets('sprout');
    const plus = syncRooms({ ...base, plus: { owned: true, lastCheckedAt: 1 } });
    expect(plus.rooms.filter((room) => room.ownerPetId === null)).toHaveLength(PLUS_ROOM_COUNT);
    expect(getVisibleRooms(plus)).toHaveLength(1 + PLUS_ROOM_COUNT);
    const lost = syncRooms({ ...plus, plus: { owned: false, lastCheckedAt: 2 } });
    expect(lost.rooms).toHaveLength(1 + PLUS_ROOM_COUNT); // kept in the save
    expect(getVisibleRooms(lost)).toHaveLength(1);
  });

  it('syncRooms strips Plus content without Plus', () => {
    let state = syncRooms({ ...withPets('sprout'), plus: { owned: true, lastCheckedAt: 1 } });
    state = withDecoration(state, 'futon');
    state = withDecoration(state, 'shell');
    const companionRoom = state.rooms.find((room) => room.ownerPetId !== null)!;
    const plusRoom = state.rooms.find((room) => room.ownerPetId === null)!;
    state = addDecorationToRoom(state, companionRoom.id, state.decorations[0].id);
    state = addDecorationToRoom(state, plusRoom.id, state.decorations[1].id);
    state = { ...state, ownedRoomStyles: [...state.ownedRoomStyles, 'japanese-room'] };
    state = setRoomStyle(state, companionRoom.id, 'japanese-room');
    const lost = syncRooms({ ...state, plus: { owned: false, lastCheckedAt: 2 } });
    expect(lost.rooms.find((room) => room.id === companionRoom.id)!.items).toHaveLength(0);
    expect(lost.rooms.find((room) => room.id === companionRoom.id)!.styleId).toBe('wooden-bedroom');
    expect(lost.rooms.find((room) => room.id === plusRoom.id)!.items).toHaveLength(0);
    expect(lost.decorations.every((decoration) => !isPlaced(decoration))).toBe(true);
    expect(lost.ownedRoomStyles).toContain('japanese-room'); // still owned for when Plus returns
  });

  it('syncRooms drops items whose ref no longer exists', () => {
    let state = withDecoration(withPets('sprout'), 'shell');
    const room = state.rooms[0];
    state = addDecorationToRoom(state, room.id, state.decorations[0].id);
    state = addCompanionToRoom(state, room.id, state.pets[0].id);
    const broken = { ...state, decorations: [], pets: state.pets };
    expect(syncRooms(broken).rooms[0].items.map((item) => item.kind)).toEqual(['companion']);
  });
});

describe('placing items', () => {
  it('isPlaced is true for room decorations, and they leave the camp bag', () => {
    let state = withDecoration(withPets('sprout'), 'shell');
    state = addDecorationToRoom(state, state.rooms[0].id, state.decorations[0].id);
    expect(isPlaced(state.decorations[0])).toBe(true);
    expect(getRoomBag(state)).toHaveLength(0);
  });

  it('a decoration already in a room or camp cannot be added again', () => {
    let state = withDecoration(withPets('sprout', 'ripple'), 'shell');
    state = addDecorationToRoom(state, state.rooms[0].id, state.decorations[0].id);
    expect(addDecorationToRoom(state, state.rooms[1].id, state.decorations[0].id)).toBe(state);
    const inCamp = { ...withDecoration(withPets('sprout'), 'acorn') };
    inCamp.decorations = [{ ...inCamp.decorations[0], camp: 0, spot: 0 }];
    expect(addDecorationToRoom(inCamp, inCamp.rooms[0].id, inCamp.decorations[0].id)).toBe(inCamp);
  });

  it('adds a companion at most once per room', () => {
    let state = withPets('sprout', 'ripple');
    const room = state.rooms[0];
    state = addCompanionToRoom(state, room.id, state.pets[1].id);
    expect(addCompanionToRoom(state, room.id, state.pets[1].id)).toBe(state);
  });

  it('stops at 30 items', () => {
    let state = withPets('sprout');
    for (let i = 0; i < MAX_ROOM_ITEMS + 2; i += 1) state = withDecoration(state, 'shell');
    for (const decoration of state.decorations) state = addDecorationToRoom(state, state.rooms[0].id, decoration.id);
    expect(state.rooms[0].items).toHaveLength(MAX_ROOM_ITEMS);
  });

  it('removing returns the decoration to the bag', () => {
    let state = withDecoration(withPets('sprout'), 'shell');
    state = addDecorationToRoom(state, state.rooms[0].id, state.decorations[0].id);
    state = removeRoomItem(state, state.rooms[0].id, state.rooms[0].items[0].id);
    expect(state.rooms[0].items).toHaveLength(0);
    expect(isPlaced(state.decorations[0])).toBe(false);
  });
});

describe('editing', () => {
  function oneItem() {
    let state = withDecoration(withPets('sprout'), 'shell');
    state = addDecorationToRoom(state, state.rooms[0].id, state.decorations[0].id);
    return { state, roomId: state.rooms[0].id, itemId: state.rooms[0].items[0].id };
  }

  it('keeps at least a quarter of the item inside the canvas', () => {
    expect(clampItemPosition(-1, 2, 0.2)).toEqual({ x: -0.05, y: 1 + 0.05 * 0.8 });
    expect(clampItemPosition(0.5, 0.5, 0.2)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('clamps the move and the scale', () => {
    const { state, roomId, itemId } = oneItem();
    const moved = moveRoomItem(state, roomId, itemId, 5, -5);
    expect(moved.rooms[0].items[0].x).toBeCloseTo(1.05);
    expect(resizeRoomItem(state, roomId, itemId, 9).rooms[0].items[0].scale).toBe(1.5);
    expect(resizeRoomItem(state, roomId, itemId, 0.1).rooms[0].items[0].scale).toBe(0.5);
  });

  it('flips and reorders layers', () => {
    let state = withDecoration(withDecoration(withPets('sprout'), 'shell'), 'acorn');
    const roomId = state.rooms[0].id;
    state = addDecorationToRoom(state, roomId, state.decorations[0].id);
    state = addDecorationToRoom(state, roomId, state.decorations[1].id);
    const [back, front] = state.rooms[0].items;
    expect(flipRoomItem(state, roomId, back.id).rooms[0].items[0].flip).toBe(true);
    expect(bringItemForward(state, roomId, back.id).rooms[0].items.map((i) => i.id)).toEqual([front.id, back.id]);
    expect(sendItemBack(state, roomId, front.id).rooms[0].items.map((i) => i.id)).toEqual([front.id, back.id]);
    expect(bringItemForward(state, roomId, front.id)).toBe(state); // already in front
  });

  it('only sets an owned style', () => {
    const { state, roomId } = oneItem();
    expect(setRoomStyle(state, roomId, 'library')).toBe(state);
  });

  it('never touches coins, Bond or XP', () => {
    const { state, roomId, itemId } = oneItem();
    const next = flipRoomItem(moveRoomItem(state, roomId, itemId, 0.3, 0.3), roomId, itemId);
    expect(next.coins).toBe(state.coins);
    expect(next.totalExperience).toBe(state.totalExperience);
    expect(next.pets).toBe(state.pets);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/rooms.test.ts`
Expected: FAIL (cannot find module `../src/utils/rooms`).

- [ ] **Step 3: Implement**

`src/utils/journey.ts`:

```ts
export function isPlaced(decoration: Decoration): boolean {
  return decoration.camp >= 0 || decoration.roomId !== undefined;
}
```

`src/utils/rooms.ts`:

```ts
import { Decoration, GameState, Room, RoomItem } from "../types";
import { getDecorationType } from "./journey";
import { STARTER_ROOM_STYLE, getRoomItemSize, getRoomStyle } from "./roomCatalog";
import { generateId } from "./idUtils";

/** Rooms spec §1. */
export const MAX_ROOM_ITEMS = 30;
export const PLUS_ROOM_COUNT = 3;
export const MIN_ITEM_SCALE = 0.5;
export const MAX_ITEM_SCALE = 1.5;
export const COMPANION_ROOM_SIZE = 0.32;
/** Canvas height / width (4:5). */
export const CANVAS_ASPECT = 1.25;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function newRoom(ownerPetId: string | null): Room {
  return { id: generateId(), ownerPetId, name: "", styleId: STARTER_ROOM_STYLE, items: [] };
}

function isPlusDecoration(decoration: Decoration | undefined): boolean {
  return Boolean(decoration && getDecorationType(decoration.typeId)?.set);
}

/**
 * Idempotent: a room per companion, Plus rooms while Plus is owned, dangling items dropped, and without
 * Plus every Plus-room decoration / Plus-set item back in the bag and Plus-set styles back to the starter.
 * Returns the same object when nothing changes.
 */
export function syncRooms(state: GameState): GameState {
  const plus = state.plus.owned;
  let changed = false;
  let rooms = [...state.rooms];

  for (const pet of state.pets) {
    if (!rooms.some((room) => room.ownerPetId === pet.id)) {
      rooms.push(newRoom(pet.id));
      changed = true;
    }
  }
  if (plus) {
    for (let count = rooms.filter((room) => room.ownerPetId === null).length; count < PLUS_ROOM_COUNT; count += 1) {
      rooms.push(newRoom(null));
      changed = true;
    }
  }

  const decorationsById = new Map(state.decorations.map((decoration) => [decoration.id, decoration]));
  const petIds = new Set(state.pets.map((pet) => pet.id));
  const kept = new Set<string>(); // decoration ids that stay in a room

  rooms = rooms.map((room) => {
    const hiddenPlusRoom = room.ownerPetId === null && !plus;
    const items = room.items.filter((item) => {
      if (item.kind === "companion") return petIds.has(item.ref);
      const decoration = decorationsById.get(item.ref);
      if (!decoration || decoration.roomId !== room.id) return false;
      if (hiddenPlusRoom || (!plus && isPlusDecoration(decoration))) return false;
      kept.add(decoration.id);
      return true;
    });
    const style = getRoomStyle(room.styleId);
    const styleId = !style || (!plus && style.set) ? STARTER_ROOM_STYLE : room.styleId;
    if (items.length === room.items.length && styleId === room.styleId) return room;
    changed = true;
    return { ...room, items, styleId };
  });

  const decorations = state.decorations.map((decoration) => {
    if (decoration.roomId !== undefined && !kept.has(decoration.id)) {
      changed = true;
      const { roomId: _removed, ...rest } = decoration;
      return rest;
    }
    return decoration;
  });

  return changed ? { ...state, rooms, decorations } : state;
}

export function getVisibleRooms(state: GameState): Room[] {
  return state.rooms.filter((room) => room.ownerPetId !== null || state.plus.owned);
}

/** Decorations free to put in a room: in the bag, and Plus-set items only with Plus. */
export function getRoomBag(state: GameState): Decoration[] {
  return state.decorations.filter(
    (decoration) =>
      decoration.camp < 0 && decoration.roomId === undefined && (state.plus.owned || !isPlusDecoration(decoration)),
  );
}

export function getItemSize(state: GameState, item: RoomItem): number {
  if (item.kind === "companion") return COMPANION_ROOM_SIZE;
  const decoration = state.decorations.find((candidate) => candidate.id === item.ref);
  return decoration ? getRoomItemSize(decoration.typeId) : getRoomItemSize("");
}

/** At least 25% of the item stays inside: the centre may pass an edge by up to a quarter of the item. */
export function clampItemPosition(x: number, y: number, size: number): { x: number; y: number } {
  const w = size;
  const h = size / CANVAS_ASPECT;
  return { x: clamp(x, -w / 4, 1 + w / 4), y: clamp(y, -h / 4, 1 + h / 4) };
}

function updateRoom(state: GameState, roomId: string, update: (room: Room) => Room | null): GameState {
  const room = state.rooms.find((candidate) => candidate.id === roomId);
  if (!room) return state;
  const next = update(room);
  if (!next || next === room) return state;
  return { ...state, rooms: state.rooms.map((candidate) => (candidate.id === roomId ? next : candidate)), lastPlayedAt: Date.now() };
}

function newItem(kind: RoomItem["kind"], ref: string): RoomItem {
  return { id: generateId(), kind, ref, x: 0.5, y: 0.6, scale: 1, flip: false };
}

export function addDecorationToRoom(state: GameState, roomId: string, decorationId: string): GameState {
  const room = getVisibleRooms(state).find((candidate) => candidate.id === roomId);
  const free = getRoomBag(state).some((decoration) => decoration.id === decorationId);
  if (!room || !free || room.items.length >= MAX_ROOM_ITEMS) return state;
  const placed = updateRoom(state, roomId, (current) => ({ ...current, items: [...current.items, newItem("decoration", decorationId)] }));
  return {
    ...placed,
    decorations: placed.decorations.map((decoration) => (decoration.id === decorationId ? { ...decoration, roomId } : decoration)),
  };
}

export function addCompanionToRoom(state: GameState, roomId: string, petId: string): GameState {
  if (!state.pets.some((pet) => pet.id === petId)) return state;
  return updateRoom(state, roomId, (room) =>
    room.items.length >= MAX_ROOM_ITEMS || room.items.some((item) => item.kind === "companion" && item.ref === petId)
      ? null
      : { ...room, items: [...room.items, newItem("companion", petId)] },
  );
}

function updateItem(state: GameState, roomId: string, itemId: string, update: (item: RoomItem) => RoomItem): GameState {
  return updateRoom(state, roomId, (room) => {
    if (!room.items.some((item) => item.id === itemId)) return null;
    return { ...room, items: room.items.map((item) => (item.id === itemId ? update(item) : item)) };
  });
}

export function moveRoomItem(state: GameState, roomId: string, itemId: string, x: number, y: number): GameState {
  return updateItem(state, roomId, itemId, (item) => ({ ...item, ...clampItemPosition(x, y, getItemSize(state, item) * item.scale) }));
}

export function resizeRoomItem(state: GameState, roomId: string, itemId: string, scale: number): GameState {
  return updateItem(state, roomId, itemId, (item) => ({ ...item, scale: clamp(scale, MIN_ITEM_SCALE, MAX_ITEM_SCALE) }));
}

export function flipRoomItem(state: GameState, roomId: string, itemId: string): GameState {
  return updateItem(state, roomId, itemId, (item) => ({ ...item, flip: !item.flip }));
}

function shiftLayer(state: GameState, roomId: string, itemId: string, delta: 1 | -1): GameState {
  return updateRoom(state, roomId, (room) => {
    const index = room.items.findIndex((item) => item.id === itemId);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= room.items.length) return null;
    const items = [...room.items];
    [items[index], items[target]] = [items[target], items[index]];
    return { ...room, items };
  });
}

export function bringItemForward(state: GameState, roomId: string, itemId: string): GameState {
  return shiftLayer(state, roomId, itemId, 1);
}

export function sendItemBack(state: GameState, roomId: string, itemId: string): GameState {
  return shiftLayer(state, roomId, itemId, -1);
}

export function removeRoomItem(state: GameState, roomId: string, itemId: string): GameState {
  const item = state.rooms.find((room) => room.id === roomId)?.items.find((candidate) => candidate.id === itemId);
  if (!item) return state;
  const next = updateRoom(state, roomId, (room) => ({ ...room, items: room.items.filter((candidate) => candidate.id !== itemId) }));
  if (item.kind !== "decoration") return next;
  return {
    ...next,
    decorations: next.decorations.map((decoration) => {
      if (decoration.id !== item.ref) return decoration;
      const { roomId: _removed, ...rest } = decoration;
      return rest;
    }),
  };
}

export function renameRoom(state: GameState, roomId: string, name: string): GameState {
  return updateRoom(state, roomId, (room) => ({ ...room, name: name.trim().slice(0, 40) }));
}

export function setRoomStyle(state: GameState, roomId: string, styleId: string): GameState {
  const style = getRoomStyle(styleId);
  if (!style || !state.ownedRoomStyles.includes(styleId) || (style.set && !state.plus.owned)) return state;
  return updateRoom(state, roomId, (room) => ({ ...room, styleId }));
}

/** Undo: put back a room snapshot taken earlier in the same editing session. */
export function replaceRoom(state: GameState, snapshot: Room): GameState {
  const placedIds = new Set(snapshot.items.filter((item) => item.kind === "decoration").map((item) => item.ref));
  return {
    ...state,
    rooms: state.rooms.map((room) => (room.id === snapshot.id ? snapshot : room)),
    decorations: state.decorations.map((decoration) => {
      if (placedIds.has(decoration.id)) return { ...decoration, roomId: snapshot.id };
      if (decoration.roomId === snapshot.id) {
        const { roomId: _removed, ...rest } = decoration;
        return rest;
      }
      return decoration;
    }),
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: all pass. If `@typescript-eslint/no-unused-vars` flags `_removed` in `npx eslint src`, keep the underscore name and add `// eslint-disable-next-line @typescript-eslint/no-unused-vars` above each destructure.

- [ ] **Step 5: Commit**

```bash
git add src/utils/rooms.ts src/utils/journey.ts __tests__/rooms.test.ts
git commit -m "feat(rooms): room operations and syncRooms (companion rooms, Plus rooms, Plus content guard)"
```

---

### Task 5: Room shop rules

**Files:**
- Create: `src/utils/roomShop.ts`
- Test: `__tests__/roomShop.test.ts`

**Interfaces:**
- Consumes: `ROOM_STYLES`, `getRoomStyle`, `isSetInSeason`, `RoomSetId` (Task 3); `getDecorationType` (journey); `generateId`
- Produces:
  - `ShopStatus = "available" | "owned" | "needs-plus" | "out-of-season" | "too-expensive"`
  - `getStyleShopStatus(state, styleId, now): ShopStatus`
  - `getFurnitureShopStatus(state, typeId, now): ShopStatus`
  - `buyRoomStyle(state, styleId, now): GameState`
  - `buyFurniture(state, typeId, now): GameState`

- [ ] **Step 1: Write the failing test** (`__tests__/roomShop.test.ts`):

```ts
import { buyFurniture, buyRoomStyle, getFurnitureShopStatus, getStyleShopStatus } from '../src/utils/roomShop';
import { createInitialGameState } from '../src/utils/initialState';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();
const rich = () => ({ ...createInitialGameState(), coins: 1000 });
const richPlus = () => ({ ...rich(), plus: { owned: true, lastCheckedAt: 1 } });

describe('room shop', () => {
  it('buys a coin style once and takes the coins', () => {
    const next = buyRoomStyle(rich(), 'library', at(2026, 7, 1));
    expect(next.ownedRoomStyles).toContain('library');
    expect(next.coins).toBe(800);
    expect(getStyleShopStatus(next, 'library', at(2026, 7, 1))).toBe('owned');
    expect(buyRoomStyle(next, 'library', at(2026, 7, 1))).toBe(next);
  });

  it('refuses when coins are short', () => {
    const poor = { ...createInitialGameState(), coins: 10 };
    expect(getFurnitureShopStatus(poor, 'bed', at(2026, 7, 1))).toBe('too-expensive');
    expect(buyFurniture(poor, 'bed', at(2026, 7, 1))).toBe(poor);
  });

  it('gates Plus sets behind Plus', () => {
    expect(getStyleShopStatus(rich(), 'japanese-room', at(2026, 7, 1))).toBe('needs-plus');
    expect(buyFurniture(rich(), 'bonsai', at(2026, 7, 1)).decorations).toHaveLength(0);
    expect(buyFurniture(richPlus(), 'bonsai', at(2026, 7, 1)).decorations[0].typeId).toBe('bonsai');
  });

  it('sells event sets only in season, even with Plus', () => {
    expect(getFurnitureShopStatus(richPlus(), 'pumpkins', at(2026, 7, 1))).toBe('out-of-season');
    expect(buyFurniture(richPlus(), 'pumpkins', at(2026, 10, 20)).decorations[0].typeId).toBe('pumpkins');
  });

  it('puts bought furniture in the bag, not in a room', () => {
    const next = buyFurniture(rich(), 'bed', at(2026, 7, 1));
    expect(next.decorations[0]).toMatchObject({ typeId: 'bed', camp: -1, spot: -1 });
    expect(next.decorations[0].roomId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/roomShop.test.ts`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement** `src/utils/roomShop.ts`:

```ts
import { GameState } from "../types";
import { getDecorationType } from "./journey";
import { RoomSetId, getRoomStyle, isSetInSeason } from "./roomCatalog";
import { generateId } from "./idUtils";

export type ShopStatus = "available" | "owned" | "needs-plus" | "out-of-season" | "too-expensive";

function gate(state: GameState, set: RoomSetId | undefined, price: number, now: number): ShopStatus {
  if (set && !state.plus.owned) return "needs-plus";
  if (set && !isSetInSeason(set, now)) return "out-of-season";
  if (state.coins < price) return "too-expensive";
  return "available";
}

export function getStyleShopStatus(state: GameState, styleId: string, now: number): ShopStatus {
  const style = getRoomStyle(styleId);
  if (!style) return "too-expensive";
  if (state.ownedRoomStyles.includes(styleId)) return "owned";
  return gate(state, style.set, style.price, now);
}

export function getFurnitureShopStatus(state: GameState, typeId: string, now: number): ShopStatus {
  const type = getDecorationType(typeId);
  if (!type || type.category !== "furniture") return "too-expensive";
  return gate(state, type.set, type.price, now);
}

export function buyRoomStyle(state: GameState, styleId: string, now: number): GameState {
  const style = getRoomStyle(styleId);
  if (!style || getStyleShopStatus(state, styleId, now) !== "available") return state;
  return { ...state, coins: state.coins - style.price, ownedRoomStyles: [...state.ownedRoomStyles, styleId], lastPlayedAt: now };
}

export function buyFurniture(state: GameState, typeId: string, now: number): GameState {
  const type = getDecorationType(typeId);
  if (!type || getFurnitureShopStatus(state, typeId, now) !== "available") return state;
  return {
    ...state,
    coins: state.coins - type.price,
    decorations: [...state.decorations, { id: generateId(), typeId, camp: -1, spot: -1 }],
    lastPlayedAt: now,
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/roomShop.ts __tests__/roomShop.test.ts
git commit -m "feat(rooms): room shop rules (coins, Plus sets, seasons)"
```

---

### Task 6: Run `syncRooms` on every persist and load

**Files:**
- Modify: `src/App.tsx` (`persistGameState`, `loadGame`)
- Test: `__tests__/rooms.test.ts` (append)

**Interfaces:**
- Consumes: `syncRooms` (Task 4)

- [ ] **Step 1: Write the failing test** (append to `__tests__/rooms.test.ts`):

```ts
import { gameStateService } from '../src/services/gameStateService';
import { createSaveData } from '../src/utils/initialState';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('migration creates rooms for existing companions', () => {
  it('gives a pre-rooms save one room per companion after load + sync', async () => {
    await AsyncStorage.clear();
    const legacy = createSaveData({ ...createInitialGameState(), pets: [createCompanion('sprout'), createCompanion('moss')] }) as any;
    delete legacy.gameState.rooms;
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(legacy));
    const result = await gameStateService.loadGame();
    if (result.status !== 'loaded') throw new Error('not loaded');
    expect(syncRooms(result.saveData.gameState).rooms).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx jest __tests__/rooms.test.ts`
Expected: PASS. This test pins the migration+sync contract that `App.tsx` relies on; the App wiring itself has no unit test.

- [ ] **Step 3: Implement** in `src/App.tsx`:
  - Import `syncRooms` from `./utils/rooms`.
  - In `persistGameState`, wrap the first line: `const syncedGameState = syncRooms(applyTutorialReward(syncRecurringTasks(nextGameState)));`.
  - In `loadGame`, wherever a loaded or new state is resolved before saving, wrap it the same way: `syncRooms(applyTutorialReward(syncRecurringTasks(...)))`. Do this for each place `loadGame` calls `applyTutorialReward(`; check with `grep -n "applyTutorialReward(" src/App.tsx`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx jest`
Expected: clean, all pass.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx __tests__/rooms.test.ts
git commit -m "feat(rooms): keep rooms in sync on every load and persist"
```

---

### Task 7: Room canvas, items and gestures

**Files:**
- Create: `src/constants/roomImages.ts`, `src/components/room/RoomCanvas.tsx`, `src/components/room/RoomItemView.tsx`

**Interfaces:**
- Consumes:
  - `Room`, `RoomItem`, `GameState`
  - `getItemSize`, `CANVAS_ASPECT`, `clampItemPosition` (Task 4)
  - `getDecorationImage` (`src/constants/journeyImages`)
  - `getPetImage` (`src/constants/petImages`)
- Produces:
  - `getRoomStyleImage(styleId): ImageSourcePropType | undefined`
  - `ROOM_STYLE_FALLBACK_COLORS: Record<string, string>`
  - `RoomCanvas` props:
    - `{ state: GameState; room: Room; width: number; selectedItemId: string | null; editable: boolean;`
    - `  onSelect(itemId: string | null): void;`
    - `  onMoveEnd(itemId: string, x: number, y: number): void;`
    - `  onResizeEnd(itemId: string, scale: number): void;`
    - `  footer?: React.ReactNode }`

UI only: verified by `tsc`, `eslint` and `expo export`, then the device test.

- [ ] **Step 1: `src/constants/roomImages.ts`.** Images are added in Task 10; until then the fallback colours show.

```ts
import { ImageSourcePropType } from "react-native";

/** Filled in when the room art lands (Task 10); missing styles fall back to a colour. */
const ROOM_STYLE_IMAGES: Partial<Record<string, ImageSourcePropType>> = {};

export const ROOM_STYLE_FALLBACK_COLORS: Record<string, string> = {
  "wooden-bedroom": "#d9b48f",
  greenhouse: "#bfe3c0",
  "starry-attic": "#3c3a6b",
  "beach-hut": "#f3dfb3",
  library: "#8a5a3c",
  "mushroom-cottage": "#e8c3b0",
  "japanese-room": "#e9dcc0",
  "spooky-attic": "#4a3a55",
  "snowy-cabin": "#dfe8f1",
  "pastel-cafe": "#f8d5e1",
  "spring-garden": "#d8efc9",
};

export function getRoomStyleImage(styleId: string): ImageSourcePropType | undefined {
  return ROOM_STYLE_IMAGES[styleId];
}
```

- [ ] **Step 2: `src/components/room/RoomItemView.tsx`.** Pan everywhere, pinch only when selected, tap to select. It commits on gesture end through `runOnJS`. If `runOnJS` isn't exported by reanimated 4.1, import `scheduleOnRN` from `react-native-worklets` and call `scheduleOnRN(fn, ...args)` instead; check with `tsc`.

```tsx
import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

interface RoomItemViewProps {
  source: ImageSourcePropType | undefined;
  fallbackIcon: string;
  canvasWidth: number;
  canvasHeight: number;
  x: number;
  y: number;
  size: number; // fraction of canvas width at scale 1
  scale: number;
  flip: boolean;
  selected: boolean;
  editable: boolean;
  onSelect: () => void;
  onMoveEnd: (x: number, y: number) => void;
  onResizeEnd: (scale: number) => void;
}

export default function RoomItemView(props: RoomItemViewProps) {
  const { canvasWidth, canvasHeight, x, y, size, scale, flip, selected, editable } = props;
  const side = size * canvasWidth;
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const pinch = useSharedValue(1);

  const pan = Gesture.Pan()
    .enabled(editable)
    .onStart(() => {
      runOnJS(props.onSelect)();
    })
    .onUpdate((event) => {
      dx.value = event.translationX;
      dy.value = event.translationY;
    })
    .onEnd(() => {
      const nextX = x + dx.value / canvasWidth;
      const nextY = y + dy.value / canvasHeight;
      dx.value = 0;
      dy.value = 0;
      runOnJS(props.onMoveEnd)(nextX, nextY);
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(editable && selected)
    .onUpdate((event) => {
      pinch.value = event.scale;
    })
    .onEnd(() => {
      const next = scale * pinch.value;
      pinch.value = 1;
      runOnJS(props.onResizeEnd)(next);
    });

  const tap = Gesture.Tap()
    .enabled(editable)
    .onEnd(() => {
      runOnJS(props.onSelect)();
    });

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx.value },
      { translateY: dy.value },
      { scale: scale * pinch.value },
      { scaleX: flip ? -1 : 1 },
    ],
  }));

  const box = {
    position: "absolute" as const,
    width: side,
    height: side,
    left: x * canvasWidth - side / 2,
    top: y * canvasHeight - side / 2,
  };

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pan, pinchGesture, tap)}>
      <Animated.View style={[box, animated, selected && styles.selected]}>
        {props.source ? (
          <Image source={props.source} style={styles.fill} resizeMode="contain" />
        ) : (
          <Text style={[styles.icon, { fontSize: side * 0.6 }]}>{props.fallbackIcon}</Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  icon: { textAlign: "center" },
  selected: { borderWidth: 2, borderColor: "rgba(255, 255, 255, 0.9)", borderStyle: "dashed", borderRadius: 8 },
});
```

- [ ] **Step 3: `src/components/room/RoomCanvas.tsx`.** It draws the style background, then the items in array order (later items render on top), and a tap on empty space deselects.

```tsx
import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { GameState, Room } from "../../types";
import { getDecorationImage } from "../../constants/journeyImages";
import { getPetImage } from "../../constants/petImages";
import { ROOM_STYLE_FALLBACK_COLORS, getRoomStyleImage } from "../../constants/roomImages";
import { getDecorationType } from "../../utils/journey";
import { CANVAS_ASPECT, getItemSize } from "../../utils/rooms";
import RoomItemView from "./RoomItemView";

interface RoomCanvasProps {
  state: GameState;
  room: Room;
  width: number;
  selectedItemId: string | null;
  editable: boolean;
  onSelect: (itemId: string | null) => void;
  onMoveEnd: (itemId: string, x: number, y: number) => void;
  onResizeEnd: (itemId: string, scale: number) => void;
  footer?: React.ReactNode;
}

const RoomCanvas = React.forwardRef<View, RoomCanvasProps>(function RoomCanvas(props, ref) {
  const { state, room, width } = props;
  const height = width * CANVAS_ASPECT;
  const background = getRoomStyleImage(room.styleId);

  return (
    <View ref={ref} collapsable={false} style={{ width, height, overflow: "hidden", backgroundColor: ROOM_STYLE_FALLBACK_COLORS[room.styleId] ?? "#d9b48f" }}>
      {background && <Image source={background} style={StyleSheet.absoluteFillObject} resizeMode="cover" />}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={() => props.onSelect(null)} />
      {room.items.map((item) => {
        let source;
        let icon = "◌";
        if (item.kind === "companion") {
          const pet = state.pets.find((candidate) => candidate.id === item.ref);
          if (!pet) return null;
          source = getPetImage(pet.templateId, pet.evolutionStage, pet.activeImageVariantId);
        } else {
          const decoration = state.decorations.find((candidate) => candidate.id === item.ref);
          if (!decoration) return null;
          source = getDecorationImage(decoration.typeId);
          icon = getDecorationType(decoration.typeId)?.icon ?? icon;
        }
        return (
          <RoomItemView
            key={item.id}
            source={source}
            fallbackIcon={icon}
            canvasWidth={width}
            canvasHeight={height}
            x={item.x}
            y={item.y}
            size={getItemSize(state, item)}
            scale={item.scale}
            flip={item.flip}
            selected={props.selectedItemId === item.id}
            editable={props.editable}
            onSelect={() => props.onSelect(item.id)}
            onMoveEnd={(x, y) => props.onMoveEnd(item.id, x, y)}
            onResizeEnd={(scale) => props.onResizeEnd(item.id, scale)}
          />
        );
      })}
      {props.footer}
    </View>
  );
});

export default RoomCanvas;
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx eslint src && npx jest`
Expected: clean, all pass.

- [ ] **Step 5: Commit**

```bash
git add src/constants/roomImages.ts src/components/room
git commit -m "feat(rooms): room canvas with draggable, pinchable, flippable items"
```

---

### Task 8: The room editor screen, the shop and the entry points

**Files:**
- Create: `src/screens/RoomEditorScreen.tsx`, `src/components/room/RoomTray.tsx`, `src/components/room/RoomShop.tsx`
- Modify: `src/App.tsx`, `src/screens/CompanionsScreen.tsx`, `src/constants/appCopy.ts` (the copy interface plus en/pt)

**Interfaces:**
- Consumes:
  - all of `rooms.ts` (Task 4) and `roomShop.ts` (Task 5)
  - `RoomCanvas` (Task 7)
  - `getVisibleRooms`
  - `isSetInSeason`, `getSetSeasonStartMonth`, `ROOM_STYLES` (Task 3)
- Produces:
  - `RoomEditorScreen` props:
    - `{ state: GameState; roomId: string; onChange(next: GameState): void;`
    - `  onClose(): void; onOpenPlus(): void; onShare(roomCanvas: View, room: Room): Promise<void> }`
  - `CompanionsScreen` new props: `onOpenRoom(roomId: string): void`, `onOpenPlus(): void` (it already receives `isPlus`)

Copy keys (en / pt):

| key | en | pt |
|---|---|---|
| `roomButton` | `Room` | `Quarto` |
| `roomDefaultName` | `{name}'s room` | `Quarto de {name}` |
| `plusRoomName` | `Plus room {number}` | `Quarto Plus {number}` |
| `plusRoomsTitle` | `Plus rooms` | `Quartos Plus` |
| `roomDone` | `Done` | `Concluído` |
| `roomShare` | `Share` | `Partilhar` |
| `roomRename` | `Rename room` | `Mudar nome do quarto` |
| `roomTabDecorations` | `Decorations` | `Decorações` |
| `roomTabCompanions` | `Companions` | `Companheiros` |
| `roomTabStyle` | `Style` | `Estilo` |
| `roomTabShop` | `Shop` | `Loja` |
| `roomFull` | `Room full (30 items)` | `Quarto cheio (30 itens)` |
| `roomBagEmpty` | `Nothing in your bag. Buy furniture in the shop or find decorations.` | `Nada no teu saco. Compra mobília na loja ou encontra decorações.` |
| `roomFlip` | `Flip` | `Virar` |
| `roomForward` | `Forward` | `Para a frente` |
| `roomBack` | `Back` | `Para trás` |
| `roomRemove` | `Remove` | `Tirar` |
| `roomUndo` | `Undo` | `Desfazer` |
| `roomShopStyles` | `Room styles` | `Estilos de quarto` |
| `roomShopFurniture` | `Furniture` | `Mobília` |
| `roomShopPlusSets` | `Plus sets` | `Conjuntos Plus` |
| `roomShopOwned` | `Owned` | `Teu` |
| `roomShopBuy` | `{price} 🪙` | `{price} 🪙` |
| `roomShopNeedsPlus` | `Plus` | `Plus` |
| `roomShopReturns` | `Returns in {month}` | `Volta em {month}` |
| `roomSetNames` (Record) | `japanese: "Japanese", halloween: "Halloween", christmas: "Christmas", valentines: "Valentine's", easter: "Easter"` | `japanese: "Japonês", halloween: "Halloween", christmas: "Natal", valentines: "Dia dos Namorados", easter: "Páscoa"` |

- [ ] **Step 1: Write `RoomTray.tsx`**, a tab bar with 4 tabs:
  - **Decorations:** a grid of `getRoomBag(state)` grouped one per `typeId` with a count. Each tile shows `DecorationIcon`-style art (`getDecorationImage` or the emoji) and its name. A tap calls `onAddDecoration(decorationId)` with the first free instance.
  - **Companions:** the player's pets. Ones already in the room are dimmed and disabled. A tap calls `onAddCompanion(petId)`.
  - **Style:** owned styles (`state.ownedRoomStyles`), with Plus-set styles disabled without Plus. A tap calls `onSetStyle(styleId)`. The current style is outlined.
  - **Shop:** renders `RoomShop`.
  - When `room.items.length >= MAX_ROOM_ITEMS`, the Decorations and Companions tabs show `copy.roomFull` instead of the grid.
  - When the bag is empty, Decorations shows `copy.roomBagEmpty`.
  - Props: `{ state, room, onAddDecoration(id), onAddCompanion(petId), onSetStyle(id), onBuyStyle(id), onBuyFurniture(typeId), onOpenPlus() }`.
  - Follow the existing modal and list styles in `JourneyScreen.tsx` (`listRow`, `bagGrid`, `bagItem`, `smallButton`).

- [ ] **Step 2: Write `RoomShop.tsx`**, with three sections:
  - **Room styles:** `ROOM_STYLES` without `set`.
  - **Furniture:** `DECORATION_TYPES` with `category === "furniture"` and no `set`.
  - **Plus sets:** grouped by `set`, with a header of `copy.roomSetNames[set]`, the set's style first, then its furniture.
  - **Each row:** the art or a fallback, the name (`roomStyleNames` / `decorationNames`), and a button labelled by `getStyleShopStatus` / `getFurnitureShopStatus(state, id, Date.now())`:
    - `available`: `roomShopBuy` with the price; calls the buy.
    - `owned`: `roomShopOwned`, disabled.
    - `needs-plus`: `roomShopNeedsPlus`; calls `onOpenPlus`.
    - `out-of-season`: `roomShopReturns` with the month from `getSetSeasonStartMonth`, formatted via `new Date(year, month, 1).toLocaleDateString(locale, { month: "long" })`; disabled.
    - `too-expensive`: the price, disabled.

- [ ] **Step 3: Write `RoomEditorScreen.tsx`**, a full-screen `Modal` (`animationType="slide"`). It holds `selectedItemId` and a one-step `undo: Room | null` in component state. Every edit goes through one function:

```tsx
const room = state.rooms.find((candidate) => candidate.id === roomId);
const commit = (next: GameState) => {
  if (room) setUndo(room); // the room as it was before this edit
  onChange(next);
};
```

- **Top bar:**
  - The room name, which opens a rename prompt (a `TextInput` modal) that calls `commit(renameRoom(...))`. The default name is `room.name || (ownerPet ? copy.roomDefaultName.replace("{name}", pet.name) : copy.plusRoomName.replace("{number}", index))`.
  - **Undo**, enabled while `undo` is set: `onChange(replaceRoom(state, undo)); setUndo(null)`.
  - **Share**: see Task 9.
  - **Done**: `onClose`.
- **Canvas:** `<RoomCanvas ref={canvasRef} width={Math.min(windowWidth - 32, 420)} .../>`, with:
  - `onMoveEnd={(id, x, y) => commit(moveRoomItem(state, roomId, id, x, y))}`
  - `onResizeEnd={(id, s) => commit(resizeRoomItem(state, roomId, id, s))}`
- **Selection toolbar,** shown only when `selectedItemId` is set: Flip, Forward, Back and Remove, calling `commit(...)` with `flipRoomItem` / `bringItemForward` / `sendItemBack` / `removeRoomItem`. Remove also clears the selection.
- **Tray:**
  - `onAddDecoration`: `commit(addDecorationToRoom(...))`, then select the new last item.
  - `onAddCompanion`: the same with `addCompanionToRoom`.
  - `onSetStyle`: `commit(setRoomStyle(...))`.
  - `onBuyStyle` / `onBuyFurniture`: `onChange(buyRoomStyle(state, id, Date.now()))` / `buyFurniture`. Buying isn't undoable.
- **If `room` is undefined** (for example a Plus room was just hidden), call `onClose()` in an effect and render nothing.

- [ ] **Step 4: Wire it into App.** In `src/App.tsx`:
  - Add `const [roomEditorId, setRoomEditorId] = useState<string | null>(null);`.
  - Add `const handleRoomChange = (next: GameState) => void persistGameState(next);`.
  - Render `RoomEditorScreen`, when `roomEditorId` is set, next to `GrowraPlusModal`, with:
    - `state={gameState} roomId={roomEditorId}`
    - `onChange={handleRoomChange}`
    - `onClose={() => setRoomEditorId(null)}`
    - `onOpenPlus={openPlus}`
    - `onShare={handleShareRoom}` (from Task 9; until then pass `async () => undefined`)
  - Pass `onOpenRoom={setRoomEditorId}` and `onOpenPlus={openPlus}` to `CompanionsScreen`.

- [ ] **Step 5: Companions entry points** (`src/screens/CompanionsScreen.tsx`):
  - **Props:** add `onOpenRoom: (roomId: string) => void; onOpenPlus: () => void;` to `CompanionsScreenProps` and destructure them.
  - **PetCard:** pass a new prop `roomId={gameState.rooms.find((room) => room.ownerPetId === pet.id)?.id}` and `onOpenRoom`. In `petActions`, after the equip button, add:

```tsx
{roomId && (
  <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.accentSoft }]} onPress={() => onOpenRoom(roomId)}>
    <Text style={[styles.actionButtonText, { color: theme.accent }]}>🏠 {copy.roomButton}</Text>
  </TouchableOpacity>
)}
```

  - **Plus rooms row:** above the `ExploreButton`, render a "Plus rooms" row with `copy.plusRoomsTitle` and 3 buttons:
    - With Plus: one per `getVisibleRooms(gameState).filter((room) => room.ownerPetId === null)`, each calling `onOpenRoom(room.id)`.
    - Without Plus: a single locked button `🔒 {copy.plusRoomsTitle}` that calls `onOpenPlus`.

- [ ] **Step 6: Verify**

Run:

```bash
npx tsc --noEmit && npx eslint src && npx jest && \
  npx expo export --platform android --output-dir /tmp/growra-export
```

Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add src/screens/RoomEditorScreen.tsx src/components/room src/App.tsx src/screens/CompanionsScreen.tsx src/constants/appCopy.ts
git commit -m "feat(rooms): room editor with tray, shop, undo and toolbar; Room buttons and Plus rooms on Companions"
```

---

### Task 9: Sharing the room picture

**Files:**
- Create: `src/utils/roomShare.ts`
- Modify: `src/screens/RoomEditorScreen.tsx`, `src/App.tsx`, `src/constants/appCopy.ts`
- Test: `__tests__/roomShare.test.ts`

**Interfaces:**
- Produces:
  - `buildRoomShareMessage(copy, ownerName: string | null): string`
  - `SHARE_SIZE = { width: 1080, height: 1350 }`
  - `shareRoomPicture(view: View, message: string, dialogTitle: string): Promise<void>`

Copy keys (en / pt):

| key | en | pt |
|---|---|---|
| `roomShareMessage` | `My {name}'s room in Growra` | `O quarto do meu {name} no Growra` |
| `roomShareMessagePlus` | `My room in Growra` | `O meu quarto no Growra` |
| `roomShareFooter` | `Made with Growra` | `Feito com o Growra` |
| `roomShareFooterToggle` | `Show "Made with Growra"` | `Mostrar "Feito com o Growra"` |
| `roomShareError` | `Couldn't share the picture. Please try again.` | `Não foi possível partilhar a imagem. Tenta outra vez.` |

- [ ] **Step 1: Write the failing test** (`__tests__/roomShare.test.ts`):

```ts
import { SHARE_SIZE, buildRoomShareMessage } from '../src/utils/roomShare';
import { getAppCopy } from '../src/constants/appCopy';

jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));

describe('room share', () => {
  it('shares at 1080x1350', () => {
    expect(SHARE_SIZE).toEqual({ width: 1080, height: 1350 });
  });

  it('names the companion, or says "my room" for Plus rooms', () => {
    const copy = getAppCopy('en');
    expect(buildRoomShareMessage(copy, 'Sprout')).toBe("My Sprout's room in Growra");
    expect(buildRoomShareMessage(copy, null)).toBe('My room in Growra');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest __tests__/roomShare.test.ts`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement.** First add the five copy keys from the table above to the copy interface and to both languages in `src/constants/appCopy.ts`. Then write `src/utils/roomShare.ts`:

```ts
import { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import type { getAppCopy } from "../constants/appCopy";

type Copy = ReturnType<typeof getAppCopy>;

export const SHARE_SIZE = { width: 1080, height: 1350 };

export function buildRoomShareMessage(copy: Copy, ownerName: string | null): string {
  return ownerName ? copy.roomShareMessage.replace("{name}", ownerName) : copy.roomShareMessagePlus;
}

/** Captures the room canvas (4:5) at 1080x1350 and opens the share sheet. */
export async function shareRoomPicture(view: View, message: string, dialogTitle: string): Promise<void> {
  const uri = await captureRef(view, { format: "png", width: SHARE_SIZE.width, height: SHARE_SIZE.height, result: "tmpfile" });
  await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle, UTI: "public.png" });
  void message; // Android's share sheet can't attach text to an image via expo-sharing; the message is used as the title.
}
```

**Ruling to record:** `expo-sharing` shares a file plus a dialog title only, so the "share text" in the spec goes into `dialogTitle`. Phase 2 can add `react-native-share` if the room code needs to travel as text.

- [ ] **Step 4: Editor share flow** (`RoomEditorScreen`):
  - **Share button:** sets `sharing = true` and `selectedItemId = null`, waits one frame (`await new Promise((r) => requestAnimationFrame(() => r(null)))`), calls `await onShare(canvasRef.current!, room)`, then sets `sharing = false`.
  - **Footer:** while `sharing && state.roomShareFooter`, pass this to `RoomCanvas`:

```tsx
<View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingVertical: 6, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center" }}>
  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>🌱 {copy.roomShareFooter}</Text>
</View>
```

  - **Plus toggle:** for Plus players only, show a small switch row under the toolbar, `copy.roomShareFooterToggle`, bound to `state.roomShareFooter`. It calls `onChange({ ...state, roomShareFooter: value })`.
  - **Without Plus,** the footer is always shown: use `state.roomShareFooter || !state.plus.owned`.

- [ ] **Step 5: App handler** (`src/App.tsx`):

```tsx
  const handleShareRoom = async (view: View, room: Room) => {
    const current = gameStateRef.current;
    if (!current) return;
    const copy = getAppCopy(current.settings.language);
    const owner = current.pets.find((pet) => pet.id === room.ownerPetId);
    const message = buildRoomShareMessage(copy, owner?.name ?? null);
    try {
      await shareRoomPicture(view, message, message);
    } catch {
      Alert.alert("🏠", copy.roomShareError);
    }
  };
```

Pass `onShare={handleShareRoom}` to `RoomEditorScreen`. Import `View` from react-native, `Room` from types, and `buildRoomShareMessage` / `shareRoomPicture`.

- [ ] **Step 6: Verify**

Run:

```bash
npx tsc --noEmit && npx eslint src && npx jest && \
  npx expo export --platform android --output-dir /tmp/growra-export
```

Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add src/utils/roomShare.ts src/screens/RoomEditorScreen.tsx src/App.tsx src/constants/appCopy.ts __tests__/roomShare.test.ts
git commit -m "feat(rooms): share the room as a 1080x1350 picture with a 'Made with Growra' footer (Plus can hide it)"
```

---

### Task 10: Room art

**Files:**
- Create:
  - `assets/rooms/styles/<style-id>.jpg` (11 files, 1080×1350 opaque)
  - `assets/journey/decorations/<furniture-id>.png` (40 files, 256×256 transparent)
- Modify: `src/constants/roomImages.ts` (`ROOM_STYLE_IMAGES`), `src/constants/journeyImages.ts` (`DECORATION_IMAGES`)

The code already falls back to colours and emoji, so the art can land in any order.

- [ ] **Step 1: Generate with Codex** in batches of at most 6 images per `codex exec` run, to stay under the background time limit. Use `--sandbox workspace-write` in `/mnt/HDD/Projects/Growra`, and a prompt following this template:

  > Make <files> for Growra's companion rooms, in the cozy high-detail pixel art style of `assets/pets/sprout/base.png` and `assets/journey/decorations/shell.png`.
  > - **Room styles:** 1080x1350 opaque PNG; an empty room seen slightly from above; the lower 60% is open floor; no characters, no text.
  > - **Furniture:** 256x256 transparent PNG; a single item centred with a small even margin; drawn free-standing (wall items included); reviewed on magenta.
  > - Only create those files, and don't touch git. If you're rate-limited, stop and say what's done.

  Batches, in order:
  1. `wooden-bedroom`, `greenhouse`, `starry-attic`, `beach-hut`, `library`, `mushroom-cottage` (styles)
  2. `japanese-room`, `spooky-attic`, `snowy-cabin`, `pastel-cafe`, `spring-garden` (styles)
  3. Furniture 1–6: `bed`, `rug`, `bookshelf`, `window`, `floor-lamp`, `potted-plant`
  4. Furniture 7–12: `round-table`, `armchair`, `cushion`, `painting`, `wall-clock`, `toy-chest`
  5. Furniture 13–16 plus 2 Japanese pieces: `desk`, `beanbag`, `fairy-lights`, `plant-shelf`, `low-table`, `futon`
  6. Japanese: `paper-lamp`, `bonsai`, `folding-screen`, `zabuton`; Halloween: `pumpkins`, `ghost-lamp`
  7. Halloween: `cauldron`, `spider-web`, `candles`; Christmas: `xmas-tree`, `presents`, `stockings`
  8. Christmas: `wreath`, `snow-globe`; Valentine's: `heart-balloons`, `rose-vase`, `love-letter-box`, `cake-stand`
  9. Easter: `egg-basket`, `bunny-plush`, `flower-crate`, `egg-garland`

  Each batch writes to `assets/rooms/styles/` (styles; the editor converts PNG to JPG at quality 85 after review) or `assets/journey/decorations/` (furniture).

- [ ] **Step 2: Review each batch** on magenta: transparent, centred, in style. Check style backgrounds at 25% for an open floor. Re-ask for any that fail.

- [ ] **Step 3: Register** each style image in `ROOM_STYLE_IMAGES` (`"wooden-bedroom": require("../../assets/rooms/styles/wooden-bedroom.jpg"),` …) and each furniture image in `DECORATION_IMAGES` (`bed: require("../../assets/journey/decorations/bed.png"),` …).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx expo export --platform android --output-dir /tmp/growra-export`
Expected: the export succeeds, so every `require` resolves.

- [ ] **Step 5: Commit after each reviewed batch**

```bash
git add assets/rooms assets/journey/decorations src/constants/roomImages.ts src/constants/journeyImages.ts
git commit -m "art(rooms): <batch description>"
```

---

### Task 11: Release on internal testing (gated)

**Gate:** Growra Plus (PR #26) has been device-tested and merged, and this branch has been rebased onto `main` (`git rebase main`; re-run `npx jest`).

- [ ] **Step 1: Version bump:** `app.json` `version` → `1.8.0`, `versionCode` +1; `package.json` `version` → `1.8.0`.
- [ ] **Step 2: Changelog,** en and pt:
  - en: "Companion rooms: decorate a room for each companion, move, resize, flip and layer anything, then share a picture." and "New Room shop with furniture and room styles, plus Japanese and seasonal sets for Plus."
  - pt: the same in pt-PT.
- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint src && npx jest && npm run check:config`
Expected: clean (ad-id warnings expected).

- [ ] **Step 4: Build and upload:**
  - `npx eas-cli build -p android --profile production --non-interactive --no-wait`.
  - When the build finishes: Play MCP `edits_insert` → `bundles_upload` → `tracks_update` on `internal` (pt-PT notes under 500 characters) → `edits_validate` → `edits_commit`.
- [ ] **Step 5: Device test by the user:**
  1. Open a companion's Room and add decorations and companions.
  2. Drag, pinch, flip, Forward/Back, Remove and Undo.
  3. Buy a style and furniture.
  4. Check the Plus rooms and sets with Plus (event sets out of season show "Returns in …").
  5. Share to WhatsApp and Instagram, and check the 1080×1350 picture and the footer.
