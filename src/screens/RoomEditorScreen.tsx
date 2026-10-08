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
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
  getVisibleRooms,
  replaceRoom,
  resizeRoomItem,
  sendItemBack,
  setRoomStyle,
} from "../utils/rooms";

interface RoomEditorScreenProps {
  state: GameState;
  roomId: string;
  /** Edits are updaters applied to the latest game state, so two quick edits can't overwrite each other. */
  onChange: (update: (current: GameState) => GameState) => void;
  onClose: () => void;
  onOpenPlus: () => void;
  onShare: (roomCanvas: View, room: Room) => Promise<void>;
  onUiTap: () => void;
  /** Played instead of the UI tap when a style or furniture purchase succeeds. */
  onCoinPurchase: () => void;
}

/** Rooms spec §2: full-screen editor for one room. */
export default function RoomEditorScreen({ state, roomId, onChange, onClose, onOpenPlus, onShare, onUiTap, onCoinPurchase }: RoomEditorScreenProps) {
  const copy = getAppCopy(state.settings.language);
  const theme = getAppTheme(state.settings.theme);
  const { width: windowWidth } = useWindowDimensions();
  const canvasRef = useRef<View>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Room | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const room = getVisibleRooms(state).find((candidate) => candidate.id === roomId);

  useEffect(() => {
    if (!room) onClose(); // gone, or hidden (e.g. a Plus room after Plus was lost)
  }, [room, onClose]);

  if (!room) return null;

  const owner = state.pets.find((pet) => pet.id === room.ownerPetId);
  const plusIndex = state.rooms.filter((candidate) => candidate.ownerPetId === null).findIndex((candidate) => candidate.id === room.id) + 1;
  const displayName =
    room.name ||
    (owner ? copy.roomDefaultName.replace("{name}", owner.name) : copy.plusRoomName.replace("{number}", String(plusIndex)));

  // Every undoable edit goes through here: the undo snapshot is the room as it was in the same
  // fresh state the edit is applied to.
  const commit = (edit: (current: GameState) => GameState, afterApply?: (next: GameState) => void) => {
    onChange((current) => {
      const next = edit(current);
      if (next === current) return current;
      onUiTap();
      const before = current.rooms.find((candidate) => candidate.id === roomId);
      if (before) setUndo(before);
      afterApply?.(next);
      return next;
    });
  };

  const applyWithoutUndo = (edit: (current: GameState) => GameState, cue: () => void = onUiTap) => {
    onChange((current) => {
      const next = edit(current);
      if (next !== current) cue();
      return next;
    });
  };

  const closeRename = () => {
    setRenaming(null);
    onUiTap();
  };

  const addAndSelect = (edit: (current: GameState) => GameState) => {
    commit(edit, (next) => {
      const placed = next.rooms.find((candidate) => candidate.id === roomId);
      setSelectedItemId(placed?.items[placed.items.length - 1]?.id ?? null);
    });
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
  const selectedId = selectedItemId;
  const toolbar: { label: string; onPress: () => void }[] = selectedId
    ? [
        { label: copy.roomFlip, onPress: () => commit((s) => flipRoomItem(s, roomId, selectedId)) },
        { label: copy.roomForward, onPress: () => commit((s) => bringItemForward(s, roomId, selectedId)) },
        { label: copy.roomBack, onPress: () => commit((s) => sendItemBack(s, roomId, selectedId)) },
        {
          label: copy.roomRemove,
          onPress: () => {
            commit((s) => removeRoomItem(s, roomId, selectedId));
            setSelectedItemId(null);
          },
        },
      ]
    : [];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      {/* An RN Modal is its own window on Android: gestures inside it need their own root. */}
      <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.nameButton}
            onPress={() => {
              setRenaming(room.name || displayName);
              onUiTap();
            }}
          >
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{displayName} ✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!undo) return;
              const snapshot = undo;
              applyWithoutUndo((current) => replaceRoom(current, snapshot));
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
            onMoveEnd={(itemId, x, y) => commit((s) => moveRoomItem(s, roomId, itemId, x, y))}
            onResizeEnd={(itemId, scale) => commit((s) => resizeRoomItem(s, roomId, itemId, scale))}
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
                onValueChange={(value) => applyWithoutUndo((s) => ({ ...s, roomShareFooter: value }))}
              />
            </View>
          )}
        </View>

        <RoomTray
          state={state}
          room={room}
          onUiTap={onUiTap}
          onAddDecoration={(decorationId) => addAndSelect((s) => addDecorationToRoom(s, roomId, decorationId))}
          onAddCompanion={(petId) => addAndSelect((s) => addCompanionToRoom(s, roomId, petId))}
          onSetStyle={(styleId) => commit((s) => setRoomStyle(s, roomId, styleId))}
          onBuyStyle={(styleId) => applyWithoutUndo((s) => buyRoomStyle(s, styleId, Date.now()), onCoinPurchase)}
          onBuyFurniture={(typeId) => applyWithoutUndo((s) => buyFurniture(s, typeId, Date.now()), onCoinPurchase)}
          onOpenPlus={onOpenPlus}
        />

        <Modal visible={renaming !== null} transparent animationType="fade" onRequestClose={closeRename}>
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
                  const name = renaming ?? "";
                  commit((s) => renameRoom(s, roomId, name));
                  setRenaming(null);
                }}
              >
                <Text style={[styles.barButton, styles.done, { color: theme.accent }]}>{copy.roomDone}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      </GestureHandlerRootView>
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
