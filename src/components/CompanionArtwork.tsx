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
      <Image source={source} style={StyleSheet.absoluteFill} resizeMode={resizeMode} />
    </View>
  );
}
