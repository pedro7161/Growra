import React from "react";
import QRCode from "react-native-qrcode-svg";

/**
 * The room code as a QR for the shared picture's footer. Error correction is the lowest level (L) and the quiet zone is
 * white, so a full 30-item room stays as sparse and as scannable as it can.
 */
export default function RoomQrBadge({ value, size }: { value: string; size: number }) {
  return <QRCode value={value} size={size} ecl="L" quietZone={Math.max(4, Math.round(size / 24))} backgroundColor="#fff" color="#000" />;
}
