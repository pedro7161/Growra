import { Room, RoomItem, GameState } from "../types";
import { MAX_ITEM_SCALE, MAX_ROOM_ITEMS, MIN_ITEM_SCALE } from "./rooms";

/** Rooms spec §3: a room's layout as text, with no names or ids (#41). */
export const ROOM_CODE_VERSION = 1;
const PREFIX = "GROWRA-ROOM-";
const POSITION_MIN = -0.25;
const POSITION_MAX = 1.25;

export interface RoomLayoutItem {
  kind: "decoration" | "companion";
  type: string; // decoration typeId or companion templateId
  x: number;
  y: number;
  scale: number;
  flip: boolean;
}

export interface RoomLayout {
  styleId: string;
  items: RoomLayoutItem[];
}

export type RoomCodeError = "format" | "checksum" | "newer";

const quantise = (value: number, min: number, max: number) =>
  Math.round((Math.min(max, Math.max(min, value)) - min) / (max - min) * 255);
const expand = (step: number, min: number, max: number) => min + (Math.min(255, Math.max(0, step)) / 255) * (max - min);

function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const toBase64Url = (text: string) => btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromBase64Url = (text: string) => atob(text.replace(/-/g, "+").replace(/_/g, "/"));

/** The layout of a room as the player sees it: real items by type, ghosts as what they stand for. */
export function roomLayout(state: GameState, room: Room): RoomLayout {
  const items: RoomLayoutItem[] = [];
  for (const item of room.items.slice(0, MAX_ROOM_ITEMS)) {
    const type = itemType(state, item);
    if (type) items.push({ ...type, x: item.x, y: item.y, scale: item.scale, flip: item.flip });
  }
  return { styleId: room.styleId, items };
}

function itemType(state: GameState, item: RoomItem): Pick<RoomLayoutItem, "kind" | "type"> | null {
  if (item.kind === "ghost") return item.ghostOf ? { kind: item.ghostOf, type: item.ref } : null;
  if (item.kind === "companion") {
    const pet = state.pets.find((candidate) => candidate.id === item.ref);
    return pet ? { kind: "companion", type: pet.templateId } : null;
  }
  const decoration = state.decorations.find((candidate) => candidate.id === item.ref);
  return decoration ? { kind: "decoration", type: decoration.typeId } : null;
}

export function encodeRoomCode(layout: RoomLayout): string {
  const payload = JSON.stringify([
    layout.styleId,
    layout.items.slice(0, MAX_ROOM_ITEMS).map((item) => [
      item.kind === "decoration" ? "d" : "c",
      item.type,
      quantise(item.x, POSITION_MIN, POSITION_MAX),
      quantise(item.y, POSITION_MIN, POSITION_MAX),
      quantise(item.scale, MIN_ITEM_SCALE, MAX_ITEM_SCALE),
      item.flip ? 1 : 0,
    ]),
  ]);
  const body = toBase64Url(payload);
  return `${PREFIX}${ROOM_CODE_VERSION}-${body}-${checksum(body)}`;
}

/** Reads a pasted code (spaces and line breaks around it are fine); nothing is changed on an error. */
export function decodeRoomCode(text: string): { layout: RoomLayout } | { error: RoomCodeError } {
  const match = text.trim().match(/^GROWRA-ROOM-(\d+)-([A-Za-z0-9_-]+)-([0-9a-f]{8})$/);
  if (!match) return { error: "format" };
  const [, version, body, sum] = match;
  if (Number(version) > ROOM_CODE_VERSION) return { error: "newer" };
  if (checksum(body) !== sum) return { error: "checksum" };
  try {
    const [styleId, rawItems] = JSON.parse(fromBase64Url(body)) as [unknown, unknown];
    if (typeof styleId !== "string" || !Array.isArray(rawItems)) return { error: "format" };
    const items: RoomLayoutItem[] = [];
    for (const raw of rawItems.slice(0, MAX_ROOM_ITEMS)) {
      if (!Array.isArray(raw) || (raw[0] !== "d" && raw[0] !== "c") || typeof raw[1] !== "string") continue;
      items.push({
        kind: raw[0] === "d" ? "decoration" : "companion",
        type: raw[1],
        x: expand(Number(raw[2]) || 0, POSITION_MIN, POSITION_MAX),
        y: expand(Number(raw[3]) || 0, POSITION_MIN, POSITION_MAX),
        scale: expand(Number(raw[4]) || 0, MIN_ITEM_SCALE, MAX_ITEM_SCALE),
        flip: raw[5] === 1,
      });
    }
    return { layout: { styleId, items } };
  } catch {
    return { error: "format" };
  }
}
