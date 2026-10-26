import React from "react";
import {
  Image,
  ImageResizeMode,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

interface CompanionArtworkProps {
  source: ImageSourcePropType;
  templateId: string;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
}

/** A companion's picture. Seasonal hats are drawn into the art itself (see getPetImage). */
export default function CompanionArtwork({ source, style, resizeMode = "contain" }: CompanionArtworkProps) {
  return (
    <View pointerEvents="none" style={style}>
      {/* Explicit 100% size: with absoluteFill the bundled image's own 1024 px size wins and only its corner shows. */}
      <Image source={source} style={styles.fill} resizeMode={resizeMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
});
