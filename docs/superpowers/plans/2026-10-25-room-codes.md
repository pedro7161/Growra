# Plan: room codes and copying a room (#41, part A)

Part A of #41, as the 2026-10-16 decision table split it: text room codes and copying, with no new
native libraries. Part B (QR on the shared picture, scan from image, `expo-camera`) comes later.

## Room code (`src/utils/roomCode.ts`)
- `GROWRA-ROOM-1-<base64url payload>-<checksum>`; payload is JSON `[styleId, [[kind, type, x, y, scale, flip], ...]]`.
  `kind` is `d` (decoration typeId) or `c` (companion templateId); x/y quantised to 0-255 over -0.25..1.25,
  scale to 0-255 over 0.5..1.5. Checksum: FNV-1a of the payload, 8 hex digits.
- No names, player ids or instance ids. At most 30 items.
- Decoding rejects a bad format, a wrong checksum or a newer version without changing anything.

## Ghosts
- `RoomItem.kind` gains `"ghost"`, with `ghostOf: "decoration" | "companion"` and `ref` = the type / template id.
- Ghosts are drawn faded with a label: "In Camp 3" / "In another room" / "Not owned" / "Not met yet".
  They are left out of the shared picture. Selecting one offers "Place" when the bag has that type.
- `syncRooms` keeps ghosts; save version 20 so an older build refuses the save instead of dropping them.

## Copying (`copyRoomLayout`)
- Editor ⋯ menu: "Share room code" (system share sheet, text) and "Copy a room" (paste a code).
- Confirm "Replace this room's layout?"; the room's decorations go back to the bag first.
- Each item is filled from the bag by type; otherwise it becomes a ghost. Met companions are placed;
  others become ghosts. The style is applied when owned; otherwise the summary names it.
- A summary lists what is missing ("You need: tent, star lamp"). The copy is one undo step.

## Deviation from the spec
- An unowned style is named in the summary instead of a faded ghost background with a Buy button.
