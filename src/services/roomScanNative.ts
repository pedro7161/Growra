import * as DocumentPicker from "expo-document-picker";
import { scanFromURLAsync } from "expo-camera";
import { RoomScanResult, scanRoomFromImage } from "./roomScan";

/**
 * Lets the player pick a picture (the system file picker, so no media permission) and reads a room QR from it.
 * Returns null if they cancel. Android support rests on expo-camera's ML Kit scanner; untested on a device (#41 part B).
 */
export async function pickAndScanRoomPicture(): Promise<RoomScanResult | null> {
  let picked: DocumentPicker.DocumentPickerResult;
  try {
    picked = await DocumentPicker.getDocumentAsync({ type: "image/*", copyToCacheDirectory: true, multiple: false });
  } catch {
    return { error: "unreadable" };
  }
  if (picked.canceled || !picked.assets?.[0]) return null;
  return scanRoomFromImage(picked.assets[0].uri, { scanFromURLAsync });
}
