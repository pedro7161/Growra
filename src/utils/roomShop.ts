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
