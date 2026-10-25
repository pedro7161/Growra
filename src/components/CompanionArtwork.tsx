import React from "react";
import {
  DimensionValue,
  Image,
  ImageResizeMode,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { currentSeason } from "../utils/seasons";

const SANTA_HAT = require("../../assets/seasonal/christmas/santa-hat-overlay.png");
const WITCH_HAT = require("../../assets/seasonal/halloween/witch-hat-overlay.png");

interface CompanionArtworkProps {
  source: ImageSourcePropType;
  templateId: string;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
}

/**
 * Where the seasonal hat sits on each companion (share of the artwork). The pets' heads are in
 * different places, so a hat only shows on companions listed here; none are yet (owner to decide:
 * hand-placed positions or hats drawn into the art).
 */
const HAT_PLACEMENT: Record<string, { top: DimensionValue; left: DimensionValue; size: DimensionValue }> = {};

/** Adds the Halloween witch hat or the Christmas Santa hat (not on Gloam or Holly, who have their own). */
export default function CompanionArtwork({
  source,
  templateId,
  style,
  resizeMode = "contain",
}: CompanionArtworkProps) {
  const season = currentSeason();
  const placement = HAT_PLACEMENT[templateId];
  const hatSource =
    !placement || templateId === "holly" || templateId === "gloam"
      ? undefined
      : season === "christmas"
        ? SANTA_HAT
        : season === "halloween"
          ? WITCH_HAT
          : undefined;

  return (
    <View pointerEvents="none" style={style}>
      <Image source={source} style={StyleSheet.absoluteFill} resizeMode={resizeMode} />
      {hatSource && (
        <Image
          source={hatSource}
          style={[styles.seasonalHat, placement && { top: placement.top, left: placement.left, width: placement.size, height: placement.size }]}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  seasonalHat: {
    position: "absolute",
    width: "42%",
    height: "42%",
    top: "0%",
    left: "31%",
  },
});
