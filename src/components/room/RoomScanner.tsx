import React, { useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera, CameraView } from "expo-camera";
import type { AppCopy } from "../../constants/appCopy";
import { RoomLayout } from "../../utils/roomCode";
import { ScanPermission, readScannedValue, requestScanPermission } from "../../services/roomScan";

interface Props {
  visible: boolean;
  copy: AppCopy;
  onClose: () => void;
  /** A valid, checksummed room layout from a QR code. The caller confirms before anything changes. */
  onLayout: (layout: RoomLayout) => void;
  /** A QR code was read but isn't a usable room code. */
  onInvalid: (message: string) => void;
}

/**
 * Live camera scan for a room QR. The camera permission is asked here, when the player opens the scanner, never
 * before. If it's refused the player is told and can still paste a code or scan from a picture.
 */
export default function RoomScanner({ visible, copy, onClose, onLayout, onInvalid }: Props) {
  const [permission, setPermission] = useState<ScanPermission | "asking">("asking");
  const handled = useRef(false);

  useEffect(() => {
    if (!visible) return;
    handled.current = false;
    setPermission("asking");
    let cancelled = false;
    void requestScanPermission(Camera).then((result) => {
      if (!cancelled) setPermission(result);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const onScanned = ({ data }: { data: string }) => {
    if (handled.current) return;
    const read = readScannedValue(data);
    handled.current = true;
    if ("layout" in read) {
      onLayout(read.layout);
      return;
    }
    onInvalid(copy.roomCodeErrors[read.error]);
    // Let the player try another code once the message is dismissed.
    setTimeout(() => {
      handled.current = false;
    }, 2500);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        {permission === "granted" ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={onScanned}
          />
        ) : null}
        <View style={styles.overlay}>
          <Text style={styles.text}>
            {permission === "denied" ? copy.roomScanDenied : permission === "granted" ? copy.roomScanHint : ""}
          </Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" style={styles.close}>
            <Text style={styles.closeText}>{copy.roomCopyCancel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000", justifyContent: "flex-end" },
  overlay: { padding: 24, gap: 16, alignItems: "center", backgroundColor: "rgba(0,0,0,0.55)" },
  text: { color: "#fff", fontSize: 16, textAlign: "center" },
  close: { paddingVertical: 10, paddingHorizontal: 24 },
  closeText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
