import React, { useState } from "react";
import { Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { taskCalendarColors } from "../constants/taskConfig";
import { AppSettings, GameState, Group, HolderId } from "../types";
import { GroupShare, buildGroupShare, encodeGroupCode, findImportedGroup, shareSummary } from "../utils/groupCode";
import { MAX_GROUPS, groupItemCount } from "../utils/groups";
import { getTodayTasks } from "../utils/taskSchedule";
import { buildWorkPreview } from "../utils/workPreview";
import GroupFormModal, { GroupFields } from "./GroupFormModal";
import GroupImportModal from "./GroupImportModal";
import GroupMenu from "./GroupMenu";

interface TasksChooserProps {
  settings: AppSettings;
  gameState: GameState;
  now: number;
  personalCount: number;
  workPreview: string;
  onChoose: (section: HolderId) => void;
  onCreateGroup: (fields: GroupFields) => "cap" | "name" | null;
  onUpdateGroup: (id: string, fields: { name: string; color: string }) => "name" | null;
  onDeleteGroup: (id: string) => void;
  onImportGroup: (share: GroupShare, mode: "new" | "update") => "cap" | null;
  onUiTap: () => void;
}

type Dialog =
  | { kind: "menu"; holder: HolderId }
  | { kind: "add" }
  | { kind: "form"; editing?: Group }
  | { kind: "import" };

/** Personal, Work and the player's groups, each with a ⋯ menu, then "+ Add group" (hidden at the cap). */
export default function TasksChooser({
  settings,
  gameState,
  now,
  personalCount,
  workPreview,
  onChoose,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onImportGroup,
  onUiTap,
}: TasksChooserProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);

  const groupPreview = (group: Group) =>
    group.kind === "list"
      ? `${getTodayTasks(group.tasks, now).length} ${copy.tasksChoosePersonalCount}`
      : buildWorkPreview(group.workItems, now, settings, true);
  const cards: { id: HolderId; title: string; detail: string; group?: Group }[] = [
    { id: "personal", title: copy.tasksChoosePersonal, detail: `${personalCount} ${copy.tasksChoosePersonalCount}` },
    { id: "work", title: copy.tasksChooseWork, detail: workPreview },
    ...gameState.groups.map((group) => ({ id: group.id, title: group.name, detail: groupPreview(group), group })),
  ];

  const menuCard = dialog?.kind === "menu" ? cards.find((card) => card.id === dialog.holder) : undefined;
  // Built-ins send their name as the player sees it, so the receiver's new group is called "Work", not "work".
  const menuShare = menuCard ? buildGroupShare(gameState, menuCard.id, menuCard.group ? undefined : menuCard.title) : undefined;
  const menuSummary = menuShare ? shareSummary(menuShare) : undefined;

  const share = (groupShare: GroupShare) => {
    close();
    const message = copy.groupShareMessage.replace("{name}", groupShare.name).replace("{code}", encodeGroupCode(groupShare));
    void Share.share({ message }).catch(() => undefined);
  };

  const openDialog = (next: Dialog) => {
    onUiTap();
    setDialog(next);
  };

  // A new group starts on the first palette colour no group uses yet.
  const usedColors = new Set(gameState.groups.map((group) => group.color));
  const defaultColor = taskCalendarColors.find((color) => !usedColors.has(color)) ?? taskCalendarColors[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{copy.tasksChooserTitle}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {cards.map((card) => (
          <View key={card.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.cardMain, card.group ? styles.groupCardMain : styles.builtInCardMain]}
              onPress={() => onChoose(card.id)}
              accessibilityRole="button"
            >
              <View style={styles.cardTitleRow}>
                {card.group ? <View style={[styles.dot, { backgroundColor: card.group.color }]} /> : null}
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                  {card.title}
                </Text>
              </View>
              <Text style={[styles.cardDetail, { color: theme.mutedText }]} numberOfLines={1}>
                {card.detail}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.more}
              onPress={() => openDialog({ kind: "menu", holder: card.id })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={copy.groupMenuLabel.replace("{name}", card.title)}
            >
              <Text style={[styles.moreText, { color: theme.mutedText }]}>⋯</Text>
            </TouchableOpacity>
          </View>
        ))}
        {gameState.groups.length < MAX_GROUPS ? (
          <TouchableOpacity
            style={[styles.addCard, { borderColor: theme.border }]}
            onPress={() => openDialog({ kind: "add" })}
            accessibilityRole="button"
          >
            <Text style={[styles.addText, { color: theme.accent }]}>{copy.groupAddCard}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {menuCard && menuSummary && menuShare ? (
        <GroupMenu
          settings={settings}
          name={menuCard.title}
          isGroup={menuCard.group !== undefined}
          shareCount={menuSummary.count}
          shareKind={menuSummary.kind}
          itemCount={menuCard.group ? groupItemCount(menuCard.group) : 0}
          onShare={() => share(menuShare)}
          onEdit={() => setDialog({ kind: "form", editing: menuCard.group })}
          onDelete={() => {
            close();
            if (menuCard.group) onDeleteGroup(menuCard.group.id);
          }}
          onClose={close}
        />
      ) : null}

      <Modal visible={dialog?.kind === "add"} transparent animationType="fade" onRequestClose={close}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close}>
          <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{copy.groupAddTitle}</Text>
            <TouchableOpacity onPress={() => setDialog({ kind: "form" })} accessibilityRole="button">
              <Text style={[styles.sheetItem, { color: theme.text }]}>{copy.groupAddNew}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDialog({ kind: "import" })} accessibilityRole="button">
              <Text style={[styles.sheetItem, { color: theme.text }]}>{copy.groupAddFromCode}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {dialog?.kind === "form" ? (
        <GroupFormModal
          settings={settings}
          editing={dialog.editing}
          defaultColor={defaultColor}
          onSubmit={(fields) => (dialog.editing ? onUpdateGroup(dialog.editing.id, fields) : onCreateGroup(fields))}
          onClose={close}
        />
      ) : null}

      {dialog?.kind === "import" ? (
        <GroupImportModal
          settings={settings}
          findExisting={(groupShare) => {
            // "Update" only replaces a group of the same type; otherwise the code is added as new.
            const existing = findImportedGroup(gameState, groupShare.sourceId);
            return existing?.kind === groupShare.kind ? existing : undefined;
          }}
          onImport={onImportGroup}
          onClose={close}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: "700" },
  content: { padding: 16, gap: 16 },
  card: { borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "flex-start" },
  cardMain: { flex: 1, minWidth: 0, paddingLeft: 20, gap: 6 },
  builtInCardMain: { paddingVertical: 28 },
  groupCardMain: { paddingVertical: 20 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  cardTitle: { fontSize: 22, fontWeight: "700", flexShrink: 1 },
  cardDetail: { fontSize: 15 },
  more: { paddingHorizontal: 16, paddingVertical: 12 },
  moreText: { fontSize: 22, fontWeight: "700" },
  addCard: { borderWidth: 1, borderStyle: "dashed", borderRadius: 12, paddingVertical: 20, alignItems: "center" },
  addText: { fontSize: 17, fontWeight: "700" },
  backdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 4 },
  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  sheetItem: { fontSize: 16, fontWeight: "600", paddingVertical: 10 },
});
