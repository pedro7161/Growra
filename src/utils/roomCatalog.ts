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
