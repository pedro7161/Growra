import { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import type { getAppCopy } from "../constants/appCopy";

type Copy = ReturnType<typeof getAppCopy>;

export const SHARE_SIZE = { width: 1080, height: 1350 };

export function buildRoomShareMessage(copy: Copy, ownerName: string | null): string {
  return ownerName ? copy.roomShareMessage.replace("{name}", ownerName) : copy.roomShareMessagePlus;
}

/**
 * Captures the room canvas (4:5) at 1080x1350 and opens the share sheet. expo-sharing can't attach text
 * to an image on Android, so the message is used as the share dialog's title.
 */
export async function shareRoomPicture(view: View, message: string): Promise<void> {
  const uri = await captureRef(view, { format: "png", width: SHARE_SIZE.width, height: SHARE_SIZE.height, result: "tmpfile" });
  await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: message, UTI: "public.png" });
}
