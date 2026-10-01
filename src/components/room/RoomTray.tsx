import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../../constants/appCopy";
import { getAppTheme } from "../../constants/appTheme";
import { getDecorationImage } from "../../constants/journeyImages";
import { getPetImage } from "../../constants/petImages";
import { ROOM_STYLE_FALLBACK_COLORS, getRoomStyleImage } from "../../constants/roomImages";
import { GameState, Room } from "../../types";
import { getDecorationType } from "../../utils/journey";
import { getRoomStyle } from "../../utils/roomCatalog";
import { MAX_ROOM_ITEMS, getRoomBag } from "../../utils/rooms";
import RoomShop from "./RoomShop";

type TrayTab = "decorations" | "companions" | "style" | "shop";

interface RoomTrayProps {
  state: GameState;
  room: Room;
  onAddDecoration: (decorationId: string) => void;
  onAddCompanion: (petId: string) => void;
  onSetStyle: (styleId: string) => void;
  onBuyStyle: (styleId: string) => void;
  onBuyFurniture: (typeId: string) => void;
  onOpenPlus: () => void;
}

export default function RoomTray(props: RoomTrayProps) {
  const { state, room } = props;
  const copy = getAppCopy(state.settings.language);
  const theme = getAppTheme(state.settings.theme);
  const [tab, setTab] = useState<TrayTab>("decorations");
  const full = room.items.length >= MAX_ROOM_ITEMS;

  // One tile per decoration type in the bag, with a count; tapping places the first free one.
  const bagByType = new Map<string, string[]>();
  getRoomBag(state).forEach((decoration) => {
    bagByType.set(decoration.typeId, [...(bagByType.get(decoration.typeId) ?? []), decoration.id]);
  });
  const inRoom = new Set(room.items.filter((item) => item.kind === "companion").map((item) => item.ref));

  const tabs: { id: TrayTab; label: string }[] = [
    { id: "decorations", label: copy.roomTabDecorations },
    { id: "companions", label: copy.roomTabCompanions },
    { id: "style", label: copy.roomTabStyle },
    { id: "shop", label: copy.roomTabShop },
  ];

  const muted = (text: string) => <Text style={[styles.muted, { color: theme.mutedText }]}>{text}</Text>;

  let content: React.ReactNode;
  if (tab === "decorations") {
    content = full
      ? muted(copy.roomFull)
      : bagByType.size === 0
        ? muted(copy.roomBagEmpty)
        : (
          <View style={styles.grid}>
            {[...bagByType.entries()].map(([typeId, ids]) => {
              const image = getDecorationImage(typeId);
              return (
                <TouchableOpacity
                  key={typeId}
                  style={[styles.tile, { backgroundColor: theme.surface }]}
                  onPress={() => props.onAddDecoration(ids[0])}
                >
                  {image ? (
                    <Image source={image} style={styles.tileImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.tileEmoji}>{getDecorationType(typeId)?.icon ?? "◌"}</Text>
                  )}
                  <Text style={[styles.tileLabel, { color: theme.mutedText }]} numberOfLines={1}>
                    {copy.decorationNames[typeId] ?? typeId}
                    {ids.length > 1 ? ` ×${ids.length}` : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
  } else if (tab === "companions") {
    content = full ? muted(copy.roomFull) : (
      <View style={styles.grid}>
        {state.pets.map((pet) => {
          const placed = inRoom.has(pet.id);
          return (
            <TouchableOpacity
              key={pet.id}
              style={[styles.tile, { backgroundColor: theme.surface, opacity: placed ? 0.4 : 1 }]}
              onPress={() => props.onAddCompanion(pet.id)}
              disabled={placed}
            >
              <Image
                source={getPetImage(pet.templateId, pet.evolutionStage, pet.activeImageVariantId)}
                style={styles.tileImage}
                resizeMode="contain"
              />
              <Text style={[styles.tileLabel, { color: theme.mutedText }]} numberOfLines={1}>{pet.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  } else if (tab === "style") {
    content = (
      <View style={styles.grid}>
        {state.ownedRoomStyles.map((styleId) => {
          const locked = Boolean(getRoomStyle(styleId)?.set) && !state.plus.owned;
          const image = getRoomStyleImage(styleId);
          return (
            <TouchableOpacity
              key={styleId}
              style={[
                styles.tile,
                {
                  backgroundColor: theme.surface,
                  borderColor: room.styleId === styleId ? theme.accent : "transparent",
                  opacity: locked ? 0.4 : 1,
                },
              ]}
              onPress={() => props.onSetStyle(styleId)}
              disabled={locked}
            >
              {image ? (
                <Image source={image} style={styles.styleImage} resizeMode="cover" />
              ) : (
                <View style={[styles.styleImage, { backgroundColor: ROOM_STYLE_FALLBACK_COLORS[styleId] }]} />
              )}
              <Text style={[styles.tileLabel, { color: theme.mutedText }]} numberOfLines={1}>
                {copy.roomStyleNames[styleId] ?? styleId}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  } else {
    content = (
      <RoomShop
        state={state}
        onBuyStyle={props.onBuyStyle}
        onBuyFurniture={props.onBuyFurniture}
        onOpenPlus={props.onOpenPlus}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
      <View style={styles.tabs}>
        {tabs.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.tab, { backgroundColor: tab === item.id ? theme.accentSoft : "transparent" }]}
            onPress={() => setTab(item.id)}
          >
            <Text style={[styles.tabText, { color: tab === item.id ? theme.accent : theme.mutedText }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content}>{content}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderTopWidth: 1 },
  tabs: { flexDirection: "row", gap: 4, padding: 8 },
  tab: { flex: 1, borderRadius: 999, paddingVertical: 7, alignItems: "center" },
  tabText: { fontSize: 12, fontWeight: "700" },
  content: { paddingHorizontal: 12, paddingBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: 84, alignItems: "center", borderRadius: 12, padding: 6, borderWidth: 2, borderColor: "transparent" },
  tileImage: { width: 52, height: 52 },
  tileEmoji: { fontSize: 36, height: 52, textAlignVertical: "center" },
  tileLabel: { fontSize: 11, marginTop: 2 },
  styleImage: { width: 52, height: 65, borderRadius: 6 },
  muted: { fontSize: 13, paddingVertical: 12 },
});
