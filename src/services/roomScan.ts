import { RoomCodeError, RoomLayout } from "../utils/roomCode";
import { parseRoomQr } from "../utils/roomQr";

/** The slice of expo-camera this feature uses, so tests can stand in for the native module. */
export interface CameraScanApi {
  requestCameraPermissionsAsync(): Promise<{ granted: boolean }>;
  scanFromURLAsync(url: string, barcodeTypes?: "qr"[]): Promise<{ data: string }[]>;
}

export type ScanPermission = "granted" | "denied";
export type RoomScanError = RoomCodeError | "noQr" | "unreadable";
export type RoomScanResult = { layout: RoomLayout } | { error: RoomScanError };

/** Asked only when the player taps scan. A refusal, or the request failing, both mean "denied". */
export async function requestScanPermission(api: Pick<CameraScanApi, "requestCameraPermissionsAsync">): Promise<ScanPermission> {
  try {
    const response = await api.requestCameraPermissionsAsync();
    return response.granted ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

/** Live camera: one scanned value, run through the same decoder as a pasted code. */
export function readScannedValue(data: string): { layout: RoomLayout } | { error: RoomCodeError } {
  return parseRoomQr(data);
}

/**
 * Scan-from-image: needs no camera permission (the picture comes from the file picker). The first QR that holds a valid
 * room wins; if QR codes were found but none is valid, the first one's error is reported.
 */
export async function scanRoomFromImage(uri: string, api: Pick<CameraScanApi, "scanFromURLAsync">): Promise<RoomScanResult> {
  let results: { data: string }[];
  try {
    results = await api.scanFromURLAsync(uri, ["qr"]);
  } catch {
    return { error: "unreadable" };
  }
  if (results.length === 0) return { error: "noQr" };
  let firstError: RoomCodeError = "format";
  for (const [index, result] of results.entries()) {
    const read = parseRoomQr(typeof result.data === "string" ? result.data : "");
    if ("layout" in read) return read;
    if (index === 0) firstError = read.error;
  }
  return { error: firstError };
}
