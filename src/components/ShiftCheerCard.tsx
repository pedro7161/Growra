import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { getPetImage } from "../constants/petImages";
import { AppSettings, Pet, WorkOccurrence } from "../types";
import { getShiftStage, shiftEncouragement } from "../utils/companionText";
import { formatClock } from "../utils/workPreview";
import CompanionArtwork from "./CompanionArtwork";

interface ShiftCheerCardProps {
  occurrence: WorkOccurrence;
  companion: Pet;
  settings: AppSettings;
  now: number;
}

/** The companion's line for the shift running now, with that shift's name and times. */
export default function ShiftCheerCard({ occurrence, companion, settings, now }: ShiftCheerCardProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  return (
    <View style={[styles.cheer, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
      <CompanionArtwork
        source={getPetImage(companion.templateId, companion.evolutionStage, companion.activeImageVariantId)}
        templateId={companion.templateId}
        style={styles.cheerArt}
      />
      <View style={styles.cheerText}>
        <Text style={[styles.cheerLine, { color: theme.text }]}>
          {shiftEncouragement(copy, getShiftStage(occurrence, now), companion.name, now)}
        </Text>
        <Text style={[styles.cheerShift, { color: theme.mutedText }]} numberOfLines={1}>
          {copy.workNow}: {occurrence.name} · {formatClock(occurrence.start)}–{formatClock(occurrence.end)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cheer: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 16, padding: 12 },
  cheerArt: { width: 56, height: 56 },
  cheerText: { flex: 1, gap: 4 },
  cheerLine: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  cheerShift: { fontSize: 13 },
});
