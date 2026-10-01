# Growra — images to generate

For: Codex / ComfyUI image generation. Written 2026-09-29 from the code and `Documents/GAME_REDESIGN.md`.
App: a free-form task app with a cute companion-pet game layer (companions + a Journey road through a valley).

## Style rules (apply to everything)
- **Look:** Growra's existing cute, high-detail pixel art with soft glow and sparkles (same family as `assets/pets/sprout`, `ripple`, `moss`). Friendly and cozy, never dark or edgy.
- **Background:** **transparent** for every sprite. No baked-in scenery, no white or cream boxes. (Most current pet images have a background square; that's what we're fixing.)
- **Framing (companions):** centered, feet on a baseline at 88% of the height, body filling about 75% of the height, light from the top-left.
- **Master size:** 1024×1024 PNG. The app ships **512 px WebP**, but deliver the PNG master.
- **Check on magenta:** view every result on a magenta background before accepting it, to spot halos and leftover background pixels.
- Keep each companion's colours and silhouette identical across its stages, so it reads as the same creature growing up.

---

## P0 — blocks the Play release (do first)

The app still ships **Expo's default template art** (a blue "A" on a grid) as its icon and splash.

| # | Asset | File | Size | Notes |
|---|---|---|---|---|
| 1 | App icon (full) | `assets/images/icon.png` | 1024×1024, **opaque** | Sprout's base form (the mushroom buddy) on a soft mint (#E6F4FE-ish) rounded background, with a small green sprout/leaf accent. Readable at 48 px. |
| 2 | Adaptive icon foreground | `assets/images/android-icon-foreground.png` | 512×512, transparent | The same Sprout, kept inside the centre **66% safe zone** (Android crops the edges). |
| 3 | Adaptive icon background | `assets/images/android-icon-background.png` | 512×512, opaque | Plain soft mint with a subtle radial glow. No detail near the edges. |
| 4 | Monochrome icon | `assets/images/android-icon-monochrome.png` | 432×432, transparent | A single-colour silhouette of the Sprout head/cap (used by Android themed icons). |
| 5 | Splash image | `assets/images/splash-icon.png` | 1024×1024, transparent | Sprout plus a small "Growra" wordmark underneath. It's shown centred at 200 px wide on white (light mode) and black (dark mode), so it needs to work on both. |
| 6 | Favicon | `assets/images/favicon.png` | 48×48 | Sprout's face only. |
| 7 | Play Store icon | (upload in Play Console) | 512×512 PNG, opaque | Same as #1. |
| 8 | Play feature graphic | (upload in Play Console) | 1024×500, opaque | A wide valley scene: a winding road of small tiles through the valley, a campfire, 3–4 companions (Sprout, Ripple, Glint, Ember) walking together. Keep the right third calm for a title overlay. |

---

## P1 — placeholder companions (they currently show another pet's picture)

These five exist in the game, but their images are copies: **Tempo, Umbra and Zephie** reuse Astra's base image for all 3 stages; **Cindra** copies Ember; **Glint** copies Pebble (a rock instead of a crystal creature). Each needs 3 stages. The written concepts and prompts are already in `src/constants/petConcepts.ts`. Use them, but **drop every "background / base / sitting on / floating above" part**, because the result must be transparent.

| Companion | Loves (game style) | Look | Files |
|---|---|---|---|
| **Tempo** | timekeeping (timers, on-time tasks) | storm puff: blue/silver cloud body, tiny lightning; evo1 a small humanoid cloud with a thunder hood; evo2 a round storm dragon spirit | `assets/pets/tempo/base.png`, `evo1.png`, `evo2.png`, `variants/default.png` (= base) |
| **Glint** | focus (timer tasks) | round crystal critter, mint/cyan/rose, small prism horns; evo1 a gemstone guardian with a crystal crown; evo2 a gem-core crystal creature | `assets/pets/glint/…` |
| **Umbra** | tidying up (clearing overdue tasks) | velvet shadow sprite, indigo/violet, tiny crescent tuft, glowing softly (cute, not scary); evo1 a small cloaked shadow; evo2 an eclipse dragon with crescent horns | `assets/pets/umbra/…` |
| **Cindra** | big days (5+ tasks) | molten cuddle beast, orange/crimson with a glowing magma belly; evo1 a round lava dino; evo2 a cute mecha-dino with glowing vents. It must look clearly different from Ember (Ember is a campfire flame sprite). | `assets/pets/cindra/…` |
| **Zephie** | making it your own (custom tasks) | fluffy wind puff, mint/sky blue/cream, spiral tufts, petals around it; evo1 a small cloud humanoid with breeze sleeves; evo2 a layered-cloud wind dragon | `assets/pets/zephie/…` |

---

## P2 — clean up the 7 real companions (transparent + consistent framing)

Sprout, Pebble, Moss, Ember, Ripple, Astra and Nova have real art, but most have baked-in ground, grass or pool scenery, or square backgrounds, at different framings. Re-render or cut out **all 3 stages** of each onto transparent, keeping the character identical and following the framing rules above. That's 21 images; the paths are the same as today (`assets/pets/<id>/base.png`, `evo1.png`, `evo2.png`). Nova's current art is a full-bleed space scene: keep the star-core creature and drop the scene.

---

## P3 — Journey road (the emoji currently standing in)

The Journey tab draws the road with emoji: 🏮 🌸 💎 🪨 🚩 🪧 🌳 on tiles, 🔥 for camps, and emoji decorations. Each item below replaces one. **Hooking these images up needs a small code change** (they're emoji in `src/utils/journey.ts` and `src/screens/JourneyScreen.tsx`); generate the art first.

### Region tiles (8)
One rounded-rectangle ground tile per region, 512×320, transparent outside the tile, seen from slightly above. Tile colour follows the region colour in `REGIONS` (journey.ts):

| Region | Colour | Tile look (from the in-game hint) |
|---|---|---|
| Sunlit Coast | #d69363 | warm sand with a little surf edge — "where the first trail markers were planted" |
| Mossway Grove | #7fae6b | soft moss and roots — "roots hum under the path" |
| Amber Dunes | #d9b25f | golden sand with footprints |
| Cloudbreak Ridge | #8fb3d9 | a stone path with wisps of cloud |
| Moonpool Marsh | #7f86c9 | a boardwalk over glowing still water |
| Glasswind Expanse | #79c2c0 | glittering crystal plain |
| Cinder Hollow | #cf7a63 | warm stone with ember light |
| Skyheart Summit | #b48fd6 | a starry mountaintop path |

Files: `assets/journey/tiles/<region-id>.png` (region ids are in `REGIONS`).

### Tile features (7 small overlay sprites, 128×128, transparent)
They sit on any tile, so keep them neutral and readable at 32 px.
`lantern` (lit paper lantern on a post), `flowers` (small flower cluster), `crystal` (single glowing crystal), `stone` (painted river stone with a tiny heart), `flag` (small pennant flag), `signpost` (wooden signpost), `tree` (small round tree).
Files: `assets/journey/features/<id>.png`.

### Camps (8 scenes, 1024×576, opaque)
A cozy campfire clearing in each region's biome, used as the camp card header. Leave **3 empty ground spots** (left, centre-right, right) where decorations get placed. Files: `assets/journey/camps/<region-id>.png`.

### Region banners (8, 1024×384, opaque)
A wide establishing view of each region for the Journey header (it shows "Sunlit Coast · Season 1"). Files: `assets/journey/banners/<region-id>.png`.

### Decorations (13 sprites, 256×256, transparent)
From `DECORATION_TYPES` in journey.ts. Buyable: flower-pot, mushroom-ring, paper-lantern, pennant, wind-chime, snowman, crystal-cluster, tent, star-lamp. Found during focus sessions: shell, feather, clover, acorn. Also an **empty spot marker** (a soft dashed circle on grass).
Files: `assets/journey/decorations/<id>.png`.

---

## P4 — later (after the above)
- **Companion moods:** a *sleepy* variant for each companion and stage (eyes closed, little "z"), shown when you've been away. 12 companions × 3 stages = 36 images at `assets/pets/<id>/sleepy/<stage>.png`. The *happy* look is the normal art, and *glowing* is an in-app effect.
- **Cosmetics** (for monetization, GAME_REDESIGN §12): 3 hats/scarves that work on all companions, as separate overlay sprites.

## Delivery checklist
- [x] P0 icon set + splash (items 1–6), then the Play icon and feature graphic (7–8). Done 2026-09-29 from Sprout's real art (cut out with rembg) plus a ComfyUI valley for the feature graphic. The Play files are in `Documents/store/` and **not uploaded yet**.
- [x] P1 the 5 placeholder companions × 3 stages. Done 2026-10-01 by Codex (PR #11, then Cindra evo1/evo2), reframed by Claude.
- [x] P2 the 7 existing companions redone transparent (21 images). Done 2026-10-01: 18 cut out by Claude (PR #14), and Nova redrawn by Codex.
- [x] P3 Journey: 8 tiles, 7 features, 8 camps, 8 banners, 14 decoration sprites. Done 2026-09-29 in ComfyUI (pixel-art LoRA) and wired into `JourneyScreen` through `src/constants/journeyImages.ts`. They ship as small JPG/PNG (2 MB total); the emoji stay as a fallback.
- [ ] P4 sleepy moods, cosmetics
