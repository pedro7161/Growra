import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { getAppTheme } from "../constants/appTheme";
import { getPetImage } from "../constants/petImages";
import { AppSettings, Pet } from "../types";

interface PraiseBubbleProps {
  text: string;
  pet: Pet;
  settings: AppSettings;
}

/** The companion's short speech bubble after a tick; floats above the bottom bar and never takes touches. */
export default function PraiseBubble({ text, pet, settings }: PraiseBubbleProps) {
  const theme = getAppTheme(settings.theme);
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={[styles.bubble, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
        <Image
          source={getPetImage(pet.templateId, pet.evolutionStage, pet.activeImageVariantId)}
          style={styles.pet}
          resizeMode="contain"
        />
        <Text style={[styles.text, { color: theme.text }]} accessibilityLiveRegion="polite">
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, bottom: 96, alignItems: "center" },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: "100%",
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pet: { width: 36, height: 36 },
  text: { flexShrink: 1, fontSize: 15, fontWeight: "700" },
});
