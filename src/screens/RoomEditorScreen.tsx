import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RoomCanvas from "../components/room/RoomCanvas";
import RoomTray from "../components/room/RoomTray";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { GameState, Room } from "../types";
import { buyFurniture, buyRoomStyle } from "../utils/roomShop";
import {
  addCompanionToRoom,
  addDecorationToRoom,
  bringItemForward,
  flipRoomItem,
  moveRoomItem,
  removeRoomItem,
  renameRoom,
  replaceRoom,
  resizeRoomItem,
  sendItemBack,
  setRoomStyle,
} from "../utils/rooms";

interface RoomEditorScreenProps {
  state: GameState;
  roomId: string;
  onChange: (next: GameState) => void;
  onClose: () => void;
  onOpenPlus: () => void;
  onShare: (roomCanvas: View, room: Room) => Promise<void>;
}

/** Rooms spec §2: full-screen editor for one room. */
export default function RoomEditorScreen({ state, roomId, onChange, onClose, onOpenPlus, onShare }: RoomEditorScreenProps) {
  const copy = getAppCopy(state.settings.language);
  const theme = getAppTheme(state.settings.theme);
  const { width: windowWidth } = useWindowDimensions();
  const canvasRef = useRef<View>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Room | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const room = state.rooms.find((candidate) => candidate.id === roomId);

  useEffect(() => {
    if (!room) onClose();
  }, [room, onClose]);

  if (!room) return null;

  const owner = state.pets.find((pet) => pet.id === room.ownerPetId);
  const plusIndex = state.rooms.filter((candidate) => candidate.ownerPetId === null).findIndex((candidate) => candidate.id === room.id) + 1;
  const displayName =
    room.name ||
    (owner ? copy.roomDefaultName.replace("{name}", owner.name) : copy.plusRoomName.replace("{number}", String(plusIndex)));

  // Every undoable edit goes through here: remember the room as it was before this edit.
  const commit = (next: GameState) => {
    if (next === state) return;
    setUndo(room);
    onChange(next);
  };

  const addAndSelect = (next: GameState) => {
    if (next === state) return;
    commit(next);
    const placed = next.rooms.find((candidate) => candidate.id === roomId);
    setSelectedItemId(placed?.items[placed.items.length - 1]?.id ?? null);
  };

  const handleShare = async () => {
    if (!canvasRef.current || sharing) return;
    setSharing(true);
    setSelectedItemId(null);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    try {
      await onShare(canvasRef.current, room);
    } finally {
      setSharing(false);
    }
  };

  const showFooter = sharing && (state.roomShareFooter || !state.plus.owned);
  const canvasWidth = Math.min(windowWidth - 32, 420);
  const toolbar: { label: string; onPress: () => void }[] = selectedItemId
    ? [
        { label: copy.roomFlip, onPress: () => commit(flipRoomItem(state, roomId, selectedItemId)) },
        { label: copy.roomForward, onPress: () => commit(bringItemForward(state, roomId, selectedItemId)) },
        { label: copy.roomBack, onPress: () => commit(sendItemBack(state, roomId, selectedItemId)) },
        {
          label: copy.roomRemove,
          onPress: () => {
            commit(removeRoomItem(state, roomId, selectedItemId));
            setSelectedItemId(null);
          },
        },
      ]
    : [];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.nameButton} onPress={() => setRenaming(room.name || displayName)}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{displayName} ✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!undo) return;
              onChange(replaceRoom(state, undo));
              setUndo(null);
              setSelectedItemId(null);
            }}
            disabled={!undo}
          >
            <Text style={[styles.barButton, { color: undo ? theme.accent : theme.border }]}>{copy.roomUndo}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void handleShare()} disabled={sharing}>
            <Text style={[styles.barButton, { color: theme.accent }]}>{copy.roomShare}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.barButton, styles.done, { color: theme.accent }]}>{copy.roomDone}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.canvasWrap}>
          <RoomCanvas
            ref={canvasRef}
            state={state}
            room={room}
            width={canvasWidth}
            selectedItemId={sharing ? null : selectedItemId}
            editable={!sharing}
            onSelect={setSelectedItemId}
            onMoveEnd={(itemId, x, y) => commit(moveRoomItem(state, roomId, itemId, x, y))}
            onResizeEnd={(itemId, scale) => commit(resizeRoomItem(state, roomId, itemId, scale))}
            footer={
              showFooter ? (
                <View style={styles.footer}>
                  <Text style={styles.footerText}>🌱 {copy.roomShareFooter}</Text>
                </View>
              ) : undefined
            }
          />
        </View>

        <View style={styles.toolbar}>
          {toolbar.map((action) => (
            <TouchableOpacity key={action.label} style={[styles.tool, { backgroundColor: theme.surface }]} onPress={action.onPress}>
              <Text style={[styles.toolText, { color: theme.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
          {state.plus.owned && !selectedItemId && (
            <View style={styles.footerToggle}>
              <Text style={[styles.toolText, { color: theme.mutedText }]}>{copy.roomShareFooterToggle}</Text>
              <Switch
                value={state.roomShareFooter}
                onValueChange={(value) => onChange({ ...state, roomShareFooter: value })}
              />
            </View>
          )}
        </View>

        <RoomTray
          state={state}
          room={room}
          onAddDecoration={(decorationId) => addAndSelect(addDecorationToRoom(state, roomId, decorationId))}
          onAddCompanion={(petId) => addAndSelect(addCompanionToRoom(state, roomId, petId))}
          onSetStyle={(styleId) => commit(setRoomStyle(state, roomId, styleId))}
          onBuyStyle={(styleId) => onChange(buyRoomStyle(state, styleId, Date.now()))}
          onBuyFurniture={(typeId) => onChange(buyFurniture(state, typeId, Date.now()))}
          onOpenPlus={onOpenPlus}
        />

        <Modal visible={renaming !== null} transparent animationType="fade" onRequestClose={() => setRenaming(null)}>
          <View style={styles.renameBackdrop}>
            <View style={[styles.renameCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.name, { color: theme.text }]}>{copy.roomRename}</Text>
              <TextInput
                value={renaming ?? ""}
                onChangeText={setRenaming}
                maxLength={40}
                autoFocus
                style={[styles.renameInput, { color: theme.text, borderColor: theme.border }]}
              />
              <TouchableOpacity
                onPress={() => {
                  commit(renameRoom(state, roomId, renaming ?? ""));
                  setRenaming(null);
                }}
              >
                <Text style={[styles.barButton, styles.done, { color: theme.accent }]}>{copy.roomDone}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  nameButton: { flex: 1 },
  name: { fontSize: 17, fontWeight: "700" },
  barButton: { fontSize: 14, fontWeight: "600" },
  done: { fontWeight: "800" },
  canvasWrap: { alignItems: "center", paddingVertical: 12 },
  toolbar: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, paddingHorizontal: 12, minHeight: 40 },
  tool: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  toolText: { fontSize: 13, fontWeight: "600" },
  footerToggle: { flexDirection: "row", alignItems: "center", gap: 6 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingVertical: 6, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center" },
  footerText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  renameBackdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.45)" },
  renameCard: { borderRadius: 16, padding: 18, gap: 12 },
  renameInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 },
});
