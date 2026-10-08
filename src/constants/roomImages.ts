import { ImageSourcePropType } from "react-native";

/** Filled in when the room art lands (Task 10); missing styles fall back to a colour. */
const ROOM_STYLE_IMAGES: Partial<Record<string, ImageSourcePropType>> = {
  "wooden-bedroom": require("../../assets/rooms/styles/wooden-bedroom.jpg"),
  "greenhouse": require("../../assets/rooms/styles/greenhouse.jpg"),
  "starry-attic": require("../../assets/rooms/styles/starry-attic.jpg"),
  "beach-hut": require("../../assets/rooms/styles/beach-hut.jpg"),
  "library": require("../../assets/rooms/styles/library.jpg"),
  "mushroom-cottage": require("../../assets/rooms/styles/mushroom-cottage.jpg"),
  "japanese-room": require("../../assets/rooms/styles/japanese-room.jpg"),
  "spooky-attic": require("../../assets/rooms/styles/spooky-attic.jpg"),
  "snowy-cabin": require("../../assets/rooms/styles/snowy-cabin.jpg"),
  "pastel-cafe": require("../../assets/rooms/styles/pastel-cafe.jpg"),
  "spring-garden": require("../../assets/rooms/styles/spring-garden.jpg"),
};

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
