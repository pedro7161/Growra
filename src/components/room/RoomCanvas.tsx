import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { GameState, Room } from "../../types";
import { getDecorationImage } from "../../constants/journeyImages";
import { getPetImage } from "../../constants/petImages";
import { ROOM_STYLE_FALLBACK_COLORS, getRoomStyleImage } from "../../constants/roomImages";
import { getDecorationType } from "../../utils/journey";
import { getAppCopy } from "../../constants/appCopy";
import { CANVAS_ASPECT, getItemSize, ghostWhere } from "../../utils/rooms";
import RoomItemView from "./RoomItemView";

interface RoomCanvasProps {
  state: GameState;
  room: Room;
  width: number;
  selectedItemId: string | null;
  editable: boolean;
  onSelect: (itemId: string | null) => void;
  onMoveEnd: (itemId: string, x: number, y: number) => void;
  onResizeEnd: (itemId: string, scale: number) => void;
  footer?: React.ReactNode;
  /** Ghosts (copied items not here yet, #41) are hidden in the shared picture. */
  showGhosts?: boolean;
}

const RoomCanvas = React.forwardRef<View, RoomCanvasProps>(function RoomCanvas(props, ref) {
  const { state, room, width } = props;
  const height = width * CANVAS_ASPECT;
  const background = getRoomStyleImage(room.styleId);
  const copy = getAppCopy(state.settings.language);

  return (
    <View ref={ref} collapsable={false} style={{ width, height, overflow: "hidden", backgroundColor: ROOM_STYLE_FALLBACK_COLORS[room.styleId] ?? "#d9b48f" }}>
      {/* Explicit size: a bundled image's own 1080x1350 size would otherwise beat the fill edges and show only its corner. */}
      {background && <Image source={background} style={{ position: "absolute", left: 0, top: 0, width, height }} resizeMode="cover" />}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={() => props.onSelect(null)} />
      {room.items.map((item) => {
        let source;
        let petTemplateId: string | undefined;
        let icon = "◌";
        let ghostLabel: string | undefined;
        if (item.kind === "ghost") {
          if (props.showGhosts === false) return null;
          if (item.ghostOf === "companion") {
            source = getPetImage(item.ref, 0, "default");
            petTemplateId = item.ref;
          } else {
            source = getDecorationImage(item.ref);
            icon = getDecorationType(item.ref)?.icon ?? icon;
          }
          const where = ghostWhere(state, item);
          ghostLabel =
            where.where === "bag"
              ? copy.roomGhostPlace
              : where.where === "camp"
                ? copy.journeyCamp.replace("{number}", String(where.camp + 1))
                : where.where === "room"
                  ? copy.roomGhostInRoom
                  : item.ghostOf === "companion"
                    ? copy.companionNotMet
                    : copy.roomGhostNotOwned;
        } else if (item.kind === "companion") {
          const pet = state.pets.find((candidate) => candidate.id === item.ref);
          if (!pet) return null;
          source = getPetImage(pet.templateId, pet.evolutionStage, pet.activeImageVariantId);
          petTemplateId = pet.templateId;
        } else {
          const decoration = state.decorations.find((candidate) => candidate.id === item.ref);
          if (!decoration) return null;
          source = getDecorationImage(decoration.typeId);
          icon = getDecorationType(decoration.typeId)?.icon ?? icon;
        }
        return (
          <RoomItemView
            key={item.id}
            source={source}
            petTemplateId={petTemplateId}
            ghostLabel={ghostLabel}
            fallbackIcon={icon}
            canvasWidth={width}
            canvasHeight={height}
            x={item.x}
            y={item.y}
            size={getItemSize(state, item)}
            scale={item.scale}
            flip={item.flip}
            selected={props.selectedItemId === item.id}
            editable={props.editable}
            onSelect={() => props.onSelect(item.id)}
            onMoveEnd={(x, y) => props.onMoveEnd(item.id, x, y)}
            onResizeEnd={(scale) => props.onResizeEnd(item.id, scale)}
          />
        );
      })}
      {props.footer}
    </View>
  );
});

export default RoomCanvas;
