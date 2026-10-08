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
  // Spec §1: a companion room shows its owner, so the owner starts in the middle of the floor.
  const items: RoomItem[] = ownerPetId ? [{ id: generateId(), kind: "companion", ref: ownerPetId, x: 0.5, y: 0.65, scale: 1, flip: false }] : [];
  return { id: generateId(), ownerPetId, name: "", styleId: STARTER_ROOM_STYLE, items };
}

/** A companion room whose owner is no longer in the save is treated like a hidden room. */
function isOrphanRoom(room: Room, petIds: Set<string>): boolean {
  return room.ownerPetId !== null && !petIds.has(room.ownerPetId);
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
    const hiddenPlusRoom = (room.ownerPetId === null && !plus) || isOrphanRoom(room, petIds);
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
  const petIds = new Set(state.pets.map((pet) => pet.id));
  return state.rooms.filter((room) => (room.ownerPetId !== null || state.plus.owned) && !isOrphanRoom(room, petIds));
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
