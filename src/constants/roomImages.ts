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
