# Companion rooms: design

Date: 2026-10-01 · Status: awaiting review · Builds on: Growra Plus (`2026-10-01-growra-plus-design.md`, PR #26)

## Goal

Give every companion a **room** the player decorates freely and **shares as a picture**. Other players can **copy the room** with a code, without any server. Success means:

- a player builds a room they like in a couple of minutes;
- sharing posts a 1080×1350 picture to WhatsApp, Instagram and so on;
- pasting a code, or picking the shared picture, rebuilds that layout from the player's own items, with ghosts for what they're missing.

Rooms follow the game rule: **coins and Plus buy looks, never progress.** No room action touches Bond, XP, streaks or the companion game.

## Scope and build order

- **Phase 1:**
  - rooms in the save, with the migration;
  - the room editor (move, resize, flip, layer, undo);
  - the Room shop and Plus rooms;
  - sharing a picture.
- **Phase 2:**
  - room codes;
  - copying a room by pasting a code or picking a shared picture (QR);
  - ghosts.

Each phase ships on its own. The work starts **after** Growra Plus 1.7.0 is tested and merged.

**Out of scope:** an in-app gallery or any server, accounts, likes and comments, rotating items, new companion art, and changes to Journey camps (they keep their 3 spots).

## 1. Data and game rules

### Save

```ts
interface RoomItem {
  id: string;
  kind: "decoration" | "companion";
  ref: string;          // decoration instance id, or pet id
  x: number;            // centre, fraction of room width, 0..1
  y: number;            // centre, fraction of room height, 0..1
  scale: number;        // 0.5..1.5
  flip: boolean;
  ghostTypeId?: string; // set while the item is a ghost (phase 2): decoration typeId or companion templateId
}

interface Room {
  id: string;
  ownerPetId: string | null; // null = a Plus extra room
  name: string;
  styleId: string;
  items: RoomItem[];         // array order = layer order (last = front)
  ghostStyleId?: string;     // phase 2: a copied style the player doesn't own
}

// GameState additions
rooms: Room[];
ownedRoomStyles: string[];   // always includes the free starter style
```

- **Decoration location:**
  - A decoration is in exactly one place: the bag, a camp spot (`camp >= 0`), or a room (`Decoration.roomId`).
  - Placing it anywhere removes it from where it was. `isPlaced()` is true for both camps and rooms.
- **Companions in rooms:**
  - Each companion appears **at most once per room**. It may appear in other rooms too, since a companion isn't a decoration.
  - A room shows its owner plus any of the player's other companions as visitors.
- **Limit:** **30 items per room**, with companions counting toward it.

### Unlocking

- **Companion rooms:**
  - A room is created automatically, with the starter style, when a companion joins.
  - A save migration creates rooms for every companion already owned, and sets `ownedRoomStyles` to the starter.
- **Plus rooms:**
  - Plus adds **3 extra rooms** (`ownerPetId: null`).
  - When Plus is lost, they're hidden, not deleted, and their decorations return to the bag. They reappear if Plus returns.
  - The same applies to Plus-only styles and furniture placed in companion rooms: they return to the bag, or to the starter style, and stay owned for when Plus returns.

### Catalog

- **Decoration categories:** `DecorationType` gains `category: "camp" | "furniture"` and `plusOnly?: boolean`.
  - **Furniture** can only be placed in rooms.
  - **Camp items** can be placed in rooms or camps.
- **Room styles:** `ROOM_STYLES: { id, price, plusOnly? }[]`:
  - 1 free starter;
  - 5 bought with coins;
  - 3 Plus-only.
- **Room shop:** buys furniture and room styles with coins. It has a Plus-only section, which opens the Plus sheet for free users. Coins remain the only currency.

### Entry points

- A **"Room"** button on each companion's card (Companions screen).
- Plus rooms are listed at the top of the Companions screen.
- No new bottom tab.

## 2. Room editor

- **Layout** (portrait):
  - **Top bar:** the room name (tap to rename), Share, Done.
  - **Canvas:** fixed **4:5**, with the style as the background.
  - **Bottom tray**, with tabs:
    - Decorations (the bag, plus camp items not placed elsewhere);
    - Companions;
    - Style;
    - Shop.
- **Add:** tap an item in the tray. It's placed at the centre, in front, and selected.
- **Select:** tap an item. It gets an outline and a toolbar with **Flip, Forward, Back, Remove**. Remove returns a decoration to the bag, or takes a companion out of the room.
- **Move:** one-finger drag. The centre is clamped so at least 25% of the item stays inside the canvas.
- **Resize:** pinch on the selected item, clamped to 0.5–1.5.
- **Deselect:** tap empty space.
- **Undo:** one level, for the last move, resize, layer change or removal.
- **Saving:**
  - Changes save when a gesture ends and when the screen is left, through the normal save path.
  - During a drag only the UI updates.
- **Room full:** at 30 items the tray shows "Room full".
- **Ghosts (phase 2):**
  - They're drawn faint, can be moved, resized or removed, and are never captured in shared pictures.
  - When the player gets an item of that type, the first ghost of that type in the room becomes the real item in its place.
- **Libraries:** `react-native-gesture-handler` and `react-native-reanimated` (already in the app). Items are absolutely positioned `Image` views inside the canvas `View`.

## 3. Sharing and copying

### Picture (phase 1)

- `react-native-view-shot` captures a hidden **1080×1350** render of the room: no ghosts, no selection outline.
- A thin footer strip shows **"Made with Growra"**. In phase 2 it also carries a small **QR code** with the room code.
  - **Plus** players can switch the footer off. In phase 2 the code then goes in the share text only.
- The image is written to the cache and shared with `expo-sharing`. The share text reads:
  - phase 1: "My {companion}'s room in Growra";
  - phase 2: the same, plus " · room code: GROWRA-ROOM-…".

### Room code (phase 2)

- **Format:** `GROWRA-ROOM-<version>-<base64url payload>-<checksum>`.
- **Payload:**
  - the style id;
  - for each item, in layer order: its type (decoration `typeId` or companion `templateId`), x and y quantised to 0–255, scale quantised to 0–255 over 0.5–1.5, and flip.
- **What it leaves out:** names, player ids and decoration instance ids. No personal data.
- **Versioning:** a version newer than the app understands, or a wrong checksum, is rejected with a friendly message. Nothing is changed.
- **Size:** at most 30 items, so a code always fits a QR code.

### Copying (phase 2)

- **Where:** editor → **⋯ → Copy a room**, either by pasting a code or by picking a picture. The picture is decoded with `expo-camera`'s scan-from-image. With no QR code in it, the player is asked to paste the code instead.
- **Confirm first:** "Replace this room's layout?". The current items return to the bag.
- **Filling:** each item is filled from the **bag first**, by type:
  - **Owned but placed elsewhere:** the item becomes a ghost labelled with where it is ("In Camp 3", "In Sprout's room"). Copying never moves the player's items.
  - **Not owned:** the item becomes a ghost, and a summary lists what's missing ("You need: tent, star lamp").
  - **Companions** the player hasn't met become ghosts.
  - **Unowned style:** it's shown as a faded `ghostStyleId` background, with a Buy button.

## 4. Art

Generated with Codex (with local ComfyUI where it fits), in Growra's cozy pixel style:

- **Room styles:** 9 empty rooms, 1080×1350, seen slightly from above, with open floor.
  - **Starter:** cozy wooden bedroom.
  - **Coins:** greenhouse, starry attic, beach hut, library, mushroom cottage.
  - **Plus:** cloud palace, crystal cave, cherry-blossom tea room.
- **Furniture:** about 20 transparent sprites, 4 of them Plus-only:
  - beds, rugs, shelves, a window, lamps, plants, a table, cushions, paintings, a bookcase.
  - Wall items are drawn free-standing.
- **Companions:** the existing transparent art for each companion's current stage.

## Libraries

| Library | Use | Phase |
|---|---|---|
| `react-native-view-shot` | capture the room as an image | 1 |
| `expo-camera` | scan a QR code from a picture | 2 |
| `react-native-qrcode-svg`, `react-native-svg` | draw the QR code in the footer | 2 |

Each library is verified against Expo SDK 54 (native debug build) in the first task of its phase, before any code depends on it.

## Testing

### Jest (pure functions)

- **Placement:** a decoration in one place at a time; companions at most once per room; the 30-item limit.
- **Editing:** clamping on move and resize, layer forward/back, and undo.
- **Migration:** rooms created for companions already owned, and the starter style owned.
- **Plus:** extra rooms hidden and restored; Plus-only items returned to the bag.
- **Phase 2:**
  - the room code round trip, checksum rejection, and a future version rejected;
  - quantisation keeping positions within half a step;
  - the copy fill: bag first, "elsewhere" ghosts, missing ghosts, an unowned style;
  - ghosts turning into real items.

### Device test by the developer

- How dragging and pinching feel.
- How the shared picture looks in WhatsApp and Instagram.
- Reading a QR code from a shared picture.
