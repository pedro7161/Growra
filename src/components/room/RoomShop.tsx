import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../../constants/appCopy";
import { getAppTheme } from "../../constants/appTheme";
import { getDecorationImage } from "../../constants/journeyImages";
import { ROOM_STYLE_FALLBACK_COLORS, getRoomStyleImage } from "../../constants/roomImages";
import { GameState } from "../../types";
import { DECORATION_TYPES } from "../../utils/journey";
import { ROOM_STYLES, RoomSetId, getSetSeasonStartMonth } from "../../utils/roomCatalog";
import { ShopStatus, getFurnitureShopStatus, getStyleShopStatus } from "../../utils/roomShop";
import { getLocaleFromSettings } from "../../utils/settings";

interface RoomShopProps {
  state: GameState;
  onBuyStyle: (styleId: string) => void;
  onBuyFurniture: (typeId: string) => void;
  onOpenPlus: () => void;
}

const SETS: RoomSetId[] = ["japanese", "halloween", "christmas", "valentines", "easter"];

/** Rooms spec §1: coin shop for room styles and furniture, with a Plus section for the sets. */
export default function RoomShop({ state, onBuyStyle, onBuyFurniture, onOpenPlus }: RoomShopProps) {
  const copy = getAppCopy(state.settings.language);
  const theme = getAppTheme(state.settings.theme);
  const locale = getLocaleFromSettings(state.settings);
  const now = Date.now();

  const statusButton = (status: ShopStatus, price: number, set: RoomSetId | undefined, onBuy: () => void) => {
    let label = copy.roomShopBuy.replace("{price}", String(price));
    let onPress: (() => void) | undefined = onBuy;
    if (status === "owned") {
      label = copy.roomShopOwned;
      onPress = undefined;
    } else if (status === "needs-plus") {
      label = copy.roomShopNeedsPlus;
      onPress = onOpenPlus;
    } else if (status === "out-of-season" && set) {
      const year = new Date(now).getFullYear();
      const month = new Date(year, getSetSeasonStartMonth(set, year), 1).toLocaleDateString(locale, { month: "long" });
      label = copy.roomShopReturns.replace("{month}", month);
      onPress = undefined;
    } else if (status === "too-expensive") {
      onPress = undefined;
    }
    const enabled = onPress !== undefined;
    return (
      <TouchableOpacity
        style={[styles.button, { backgroundColor: enabled ? theme.accent : theme.border }]}
        onPress={onPress}
        disabled={!enabled}
      >
        <Text style={[styles.buttonText, { color: enabled ? theme.accentText : theme.mutedText }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const styleRow = (styleId: string, price: number, set?: RoomSetId) => {
    const image = getRoomStyleImage(styleId);
    return (
      <View key={`style-${styleId}`} style={[styles.row, { backgroundColor: theme.surface }]}>
        {image ? (
          <Image source={image} style={styles.styleThumb} resizeMode="cover" />
        ) : (
          <View style={[styles.styleThumb, { backgroundColor: ROOM_STYLE_FALLBACK_COLORS[styleId] }]} />
        )}
        <Text style={[styles.name, { color: theme.text }]}>{copy.roomStyleNames[styleId] ?? styleId}</Text>
        {statusButton(getStyleShopStatus(state, styleId, now), price, set, () => onBuyStyle(styleId))}
      </View>
    );
  };

  const furnitureRow = (typeId: string, icon: string, price: number, set?: RoomSetId) => {
    const image = getDecorationImage(typeId);
    return (
      <View key={`furniture-${typeId}`} style={[styles.row, { backgroundColor: theme.surface }]}>
        {image ? (
          <Image source={image} style={styles.icon} resizeMode="contain" />
        ) : (
          <Text style={styles.emoji}>{icon}</Text>
        )}
        <Text style={[styles.name, { color: theme.text }]}>{copy.decorationNames[typeId] ?? typeId}</Text>
        {statusButton(getFurnitureShopStatus(state, typeId, now), price, set, () => onBuyFurniture(typeId))}
      </View>
    );
  };

  const furniture = DECORATION_TYPES.filter((type) => type.category === "furniture");

  return (
    <View style={styles.container}>
      <Text style={[styles.section, { color: theme.text }]}>{copy.roomShopStyles}</Text>
      {ROOM_STYLES.filter((style) => !style.set && style.price > 0).map((style) => styleRow(style.id, style.price))}

      <Text style={[styles.section, { color: theme.text }]}>{copy.roomShopFurniture}</Text>
      {furniture.filter((type) => !type.set).map((type) => furnitureRow(type.id, type.icon, type.price))}

      <Text style={[styles.section, { color: theme.text }]}>{copy.roomShopPlusSets}</Text>
      {SETS.map((set) => (
        <View key={set} style={styles.set}>
          <Text style={[styles.setTitle, { color: theme.accent }]}>{copy.roomSetNames[set]}</Text>
          {ROOM_STYLES.filter((style) => style.set === set).map((style) => styleRow(style.id, style.price, set))}
          {furniture.filter((type) => type.set === set).map((type) => furnitureRow(type.id, type.icon, type.price, set))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingBottom: 16 },
  section: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  set: { gap: 8 },
  setTitle: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 8 },
  styleThumb: { width: 40, height: 50, borderRadius: 6 },
  icon: { width: 40, height: 40 },
  emoji: { fontSize: 28, width: 40, textAlign: "center" },
  name: { flex: 1, fontSize: 14 },
  button: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  buttonText: { fontSize: 12, fontWeight: "700" },
});
