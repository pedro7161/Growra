import { RoomCodeError, RoomLayout, decodeRoomCode, encodeRoomCode } from "./roomCode";

/** A QR code holds at most 2953 bytes (version 40, lowest error correction); room codes are ASCII, one byte a character. */
export const QR_MAX_BYTES = 2953;

const CODE_IN_TEXT = /GROWRA-ROOM-[A-Za-z0-9_-]+/;

/** What the QR on a shared picture encodes: the Part A room code, unchanged. */
export function roomQrValue(layout: RoomLayout): string {
  return encodeRoomCode(layout);
}

/**
 * Reads whatever a scanner returned. The room code may sit inside other text (a shared message), so it is picked
 * out first; then the same decoder as pasting a code applies (prefix, version, checksum, shape). Never throws.
 */
export function parseRoomQr(data: string): { layout: RoomLayout } | { error: RoomCodeError } {
  const found = data.match(CODE_IN_TEXT);
  return decodeRoomCode(found ? found[0] : data);
}
