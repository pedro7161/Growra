import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ShiftCheerCard from "../components/ShiftCheerCard";
import WorkItemModal from "../components/WorkItemModal";
import WorkOccurrenceRow from "../components/WorkOccurrenceRow";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, GameState, WorkEditScope, WorkItem, WorkOccurrence } from "../types";
import { getActiveCompanion } from "../utils/companions";
import { generateId } from "../utils/idUtils";
import { getLocaleFromSettings } from "../utils/settings";
import { addDaysToKey, weekStartKey, WorkItemFields } from "../utils/workForm";
import {
  canCompleteOccurrence,
  createWorkItem,
  dateKeyToStart,
  getOccurrencesBetween,
  getRunningOccurrence,
  toDateKey,
  withValidCompletions,
} from "../utils/workSchedule";

interface WorkScreenProps {
  gameState: GameState;
  settings: AppSettings;
  now: number;
  onBackToChooser: () => void;
  /** The work calendar; the button is hidden until there is one. */
  onOpenCalendar?: () => void;
  /** Adds a new item or replaces an existing one with the same id. */
  onSaveItem: (item: WorkItem) => void;
  onEditOccurrence: (itemId: string, dateKey: string, fields: WorkItemFields, scope: WorkEditScope) => void;
  onDeleteOccurrence: (itemId: string, dateKey: string, scope: WorkEditScope) => void;
  onCompleteOccurrence: (itemId: string, dateKey: string) => void;
  onSetView: (view: AppSettings["workView"]) => void;
}

type Editing = { item: WorkItem; occurrence: WorkOccurrence } | null;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default function WorkScreen({
  gameState,
  settings,
  now,
  onBackToChooser,
  onOpenCalendar,
  onSaveItem,
  onEditOccurrence,
  onDeleteOccurrence,
  onCompleteOccurrence,
  onSetView,
}: WorkScreenProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = getLocaleFromSettings(settings);
  const items = gameState.workItems;
  const view = settings.workView;
  const todayKey = toDateKey(now);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);

  const weekStart = weekStartKey(selectedKey);
  const rangeStart = view === "day" ? selectedKey : weekStart;
  const rangeEnd = addDaysToKey(rangeStart, view === "day" ? 1 : 7);
  const occurrences = useMemo(() => getOccurrencesBetween(items, rangeStart, rangeEnd), [items, rangeStart, rangeEnd]);
  const running = getRunningOccurrence(items, now);
  const companion = getActiveCompanion(gameState);

  const format = (key: string, options: Intl.DateTimeFormatOptions) =>
    capitalize(new Intl.DateTimeFormat(locale, options).format(new Date(dateKeyToStart(key))));
  const title =
    view === "day"
      ? format(selectedKey, { weekday: "long", day: "numeric", month: "long" })
      : `${format(weekStart, { day: "numeric", month: "short" })} – ${format(addDaysToKey(weekStart, 6), { day: "numeric", month: "short" })}`;
  const inCurrentRange = todayKey >= rangeStart && todayKey < rangeEnd;

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openOccurrence = (occurrence: WorkOccurrence) => {
    const item = items.find((candidate) => candidate.id === occurrence.itemId);
    if (!item) return;
    setEditing({ item, occurrence });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleSave = (fields: WorkItemFields, scope: WorkEditScope | null) => {
    if (!editing) onSaveItem(createWorkItem(fields, generateId(), Date.now()));
    else if (scope === null) onSaveItem(withValidCompletions({ ...editing.item, ...fields }));
    else onEditOccurrence(editing.item.id, editing.occurrence.dateKey, fields, scope);
    closeModal();
  };
  const handleDelete = (scope: WorkEditScope | null) => {
    if (editing) onDeleteOccurrence(editing.item.id, editing.occurrence.dateKey, scope ?? "one");
    closeModal();
  };

  const row = (occurrence: WorkOccurrence, compact: boolean) => (
    <WorkOccurrenceRow
      key={`${occurrence.itemId}-${occurrence.dateKey}`}
      occurrence={occurrence}
      settings={settings}
      now={now}
      compact={compact}
      onOpen={() => openOccurrence(occurrence)}
      onComplete={() => onCompleteOccurrence(occurrence.itemId, occurrence.dateKey)}
    />
  );

  const navButton = (label: string, accessibilityLabel: string, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.navButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.navButtonText, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderDay = () =>
    occurrences.length === 0 ? (
      <Text style={[styles.empty, { color: theme.mutedText }]}>{copy.workNoShiftsDay}</Text>
    ) : (
      occurrences.map((occurrence) => row(occurrence, false))
    );

  const renderWeek = () =>
    Array.from({ length: 7 }, (_, index) => addDaysToKey(weekStart, index)).map((key) => {
      const dayOccurrences = occurrences.filter((occurrence) => occurrence.dateKey === key);
      return (
        <View key={key} style={styles.weekDay}>
          <TouchableOpacity
            onPress={() => {
              setSelectedKey(key);
              onSetView("day");
            }}
            accessibilityRole="button"
          >
            <Text style={[styles.weekDayLabel, { color: key === todayKey ? theme.accent : theme.text }]}>
              {format(key, { weekday: "short", day: "numeric", month: "short" })}
            </Text>
          </TouchableOpacity>
          {dayOccurrences.length === 0 ? (
            <Text style={[styles.weekEmpty, { color: theme.mutedText }]}>—</Text>
          ) : (
            dayOccurrences.map((occurrence) => row(occurrence, true))
          )}
        </View>
      );
    });

  const editingCompletable = editing ? canCompleteOccurrence(editing.occurrence, now) : false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerText}>
          <TouchableOpacity onPress={onBackToChooser} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button">
            <Text style={[styles.back, { color: theme.accent }]}>{copy.tasksBackToChooser}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {copy.workTitle}
          </Text>
        </View>
        {onOpenCalendar ? (
          <TouchableOpacity style={[styles.headerButton, { borderColor: theme.border }]} onPress={onOpenCalendar} accessibilityRole="button">
            <Text style={[styles.headerButtonText, { color: theme.text }]}>{copy.workCalendar}</Text>
          </TouchableOpacity>
        ) : null}
        {items.length > 0 ? (
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={openNew} accessibilityRole="button">
            <Text style={[styles.headerButtonText, { color: theme.accentText }]}>{copy.workAdd}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {running && companion ? (
          <ShiftCheerCard occurrence={running} companion={companion} settings={settings} now={now} />
        ) : null}

        {items.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{copy.workEmptyTitle}</Text>
            <Text style={[styles.emptyBody, { color: theme.mutedText }]}>{copy.workEmptyBody}</Text>
            <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.accent }]} onPress={openNew} accessibilityRole="button">
              <Text style={[styles.emptyButtonText, { color: theme.accentText }]}>{copy.workEmptyAdd}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.segment, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
              {(["day", "week"] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.segmentButton, view === option && { backgroundColor: theme.accent }]}
                  onPress={() => view !== option && onSetView(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: view === option }}
                >
                  <Text style={[styles.segmentText, { color: view === option ? theme.accentText : theme.mutedText }]}>
                    {option === "day" ? copy.workViewDay : copy.workViewWeek}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.navRow}>
              {navButton("‹", copy.workPrevious, () => setSelectedKey(addDaysToKey(selectedKey, view === "day" ? -1 : -7)))}
              <Text style={[styles.navTitle, { color: theme.text }]} numberOfLines={1}>
                {title}
              </Text>
              {navButton("›", copy.workNext, () => setSelectedKey(addDaysToKey(selectedKey, view === "day" ? 1 : 7)))}
            </View>
            {(view === "day" ? selectedKey !== todayKey : !inCurrentRange) ? (
              <TouchableOpacity style={styles.todayButton} onPress={() => setSelectedKey(todayKey)} accessibilityRole="button">
                <Text style={[styles.todayText, { color: theme.accent }]}>{copy.workToday}</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.list}>{view === "day" ? renderDay() : renderWeek()}</View>
          </>
        )}
      </ScrollView>

      <WorkItemModal
        visible={modalOpen}
        settings={settings}
        editing={editing}
        newDateKey={selectedKey}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
        onComplete={
          editing && editingCompletable
            ? () => {
                onCompleteOccurrence(editing.item.id, editing.occurrence.dateKey);
                closeModal();
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerText: { flex: 1, minWidth: 0 },
  back: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  title: { fontSize: 24, fontWeight: "700" },
  headerButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  headerButtonText: { fontSize: 14, fontWeight: "700" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 20, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, lineHeight: 20 },
  emptyButton: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 6 },
  emptyButtonText: { fontSize: 15, fontWeight: "700" },
  segment: { flexDirection: "row", borderWidth: 1, borderRadius: 999, padding: 3 },
  segmentButton: { flex: 1, borderRadius: 999, paddingVertical: 8, alignItems: "center" },
  segmentText: { fontSize: 14, fontWeight: "700" },
  navRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  navButton: { width: 40, height: 40, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  navButtonText: { fontSize: 20, fontWeight: "700" },
  navTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700" },
  todayButton: { alignSelf: "center", paddingHorizontal: 12, paddingVertical: 4 },
  todayText: { fontSize: 14, fontWeight: "700" },
  list: { gap: 10 },
  empty: { fontSize: 14, textAlign: "center", paddingVertical: 24 },
  weekDay: { gap: 6 },
  weekDayLabel: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  weekEmpty: { fontSize: 13, paddingLeft: 4 },
});
