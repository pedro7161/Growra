import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

interface GrowraPlusModalProps {
  visible: boolean;
  settings: AppSettings;
  isPlus: boolean;
  price: string | null;
  busy: boolean;
  onBuy: () => void;
  onRestore: () => void;
  onClose: () => void;
}

export default function GrowraPlusModal({ visible, settings, isPlus, price, busy, onBuy, onRestore, onClose }: GrowraPlusModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const perks = [copy.plusPerkThemes, copy.plusPerkHistory, copy.plusPerkExport, copy.plusPerkNoAds];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>{copy.plusTitle}</Text>
          <Text style={[styles.pitch, { color: theme.mutedText }]}>{copy.plusPitch}</Text>
          {perks.map((perk) => (
            <Text key={perk} style={[styles.perk, { color: theme.text }]}>✓  {perk}</Text>
          ))}
          {isPlus ? (
            <Text style={[styles.owned, { color: theme.success }]}>{copy.plusOwned}</Text>
          ) : (
            <TouchableOpacity
              style={[styles.buy, { backgroundColor: price ? theme.accent : theme.border }]}
              onPress={onBuy}
              disabled={!price || busy}
            >
              {busy ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <Text style={[styles.buyText, { color: price ? theme.accentText : theme.mutedText }]}>
                  {price ? copy.plusBuy.replace("{price}", price) : copy.plusUnavailable}
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRestore} disabled={busy}>
            <Text style={[styles.link, { color: theme.accent }]}>{copy.plusRestore}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.link, { color: theme.mutedText }]}>{copy.journeyClose}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.45)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, gap: 10 },
  title: { fontSize: 22, fontWeight: "700" },
  pitch: { fontSize: 14, marginBottom: 6 },
  perk: { fontSize: 15 },
  owned: { fontSize: 15, fontWeight: "700", marginTop: 10 },
  buy: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  buyText: { fontSize: 16, fontWeight: "700" },
  link: { fontSize: 14, fontWeight: "600", textAlign: "center", paddingVertical: 6 },
});
