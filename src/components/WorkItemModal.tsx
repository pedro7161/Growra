import React, { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { taskCalendarColors } from "../constants/taskConfig";
import { AppSettings, WorkEditScope, WorkItem, WorkOccurrence } from "../types";
import { getLocaleFromSettings } from "../utils/settings";
import {
  changesSeriesRule,
  draftFromItem,
  draftToFields,
  EndChoice,
  newWorkDraft,
  parseClock,
  RepeatChoice,
  WEEKDAYS_MONDAY_FIRST,
  WorkDraft,
  WorkDraftError,
  WorkItemFields,
} from "../utils/workForm";
import { dateKeyToStart, toDateKey } from "../utils/workSchedule";
import TaskDatePicker from "./TaskDatePicker";
import WorkScopePrompt from "./WorkScopePrompt";

interface WorkItemModalProps {
  visible: boolean;
  settings: AppSettings;
  /** The occurrence being edited, or null to add a new item starting on `newDateKey`. */
  editing: { item: WorkItem; occurrence: WorkOccurrence } | null;
  newDateKey: string;
  onClose: () => void;
  /** scope is null for a new item or an item that doesn't repeat (the whole item is replaced). */
  onSave: (fields: WorkItemFields, scope: WorkEditScope | null) => void;
  onDelete: (scope: WorkEditScope | null) => void;
  /** Present only while the occurrence can be ticked off. */
  onComplete?: () => void;
  /** A group's item rather than a work shift: the title, name hint and tick button drop the word "shift". */
  forGroup?: boolean;
}

const REPEAT_CHOICES: RepeatChoice[] = ["none", "daily", "xdays", "weekly", "xweeks", "monthly"];
const END_CHOICES: EndChoice[] = ["never", "count", "until"];

function weekdayLabel(locale: string, weekday: number): string {
  // 2023-12-31 was a Sunday, so day 31 + weekday lands on that weekday.
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2023, 11, 31 + weekday)).replace(".", "").slice(0, 3);
}

function longDate(locale: string, key: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(new Date(dateKeyToStart(key)));
}

export default function WorkItemModal({
  visible,
  settings,
  editing,
  newDateKey,
  onClose,
  onSave,
  onDelete,
  onComplete,
  forGroup = false,
}: WorkItemModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = getLocaleFromSettings(settings);
  const [draft, setDraft] = useState<WorkDraft>(() => newWorkDraft(newDateKey));
  const [error, setError] = useState<WorkDraftError | null>(null);
  const [prompt, setPrompt] = useState<{ action: "edit" | "delete"; fields?: WorkItemFields } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraft(editing ? draftFromItem(editing.item, editing.occurrence) : newWorkDraft(newDateKey));
    setError(null);
    setPrompt(null);
    setConfirmingDelete(false);
  }, [visible, editing, newDateKey]);

  const repeats = editing ? editing.item.repeat.kind !== "none" : false;
  const update = (patch: Partial<WorkDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const handleSave = () => {
    const result = draftToFields(draft);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (repeats) setPrompt({ action: "edit", fields: result.fields });
    else onSave(result.fields, null);
  };

  const handleDelete = () => {
    if (repeats) setPrompt({ action: "delete" });
    else if (confirmingDelete) onDelete(null);
    else setConfirmingDelete(true);
  };

  const handleScope = (scope: WorkEditScope) => {
    const pending = prompt;
    setPrompt(null);
    if (pending?.action === "edit" && pending.fields) onSave(pending.fields, scope);
    if (pending?.action === "delete") onDelete(scope);
  };

  const inputStyle = [styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }];
  const chip = (key: string, label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={key}
      style={[styles.chip, { backgroundColor: active ? theme.accent : theme.surfaceMuted, borderColor: active ? theme.accent : theme.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, { color: active ? theme.accentText : theme.mutedText }]}>{label}</Text>
    </TouchableOpacity>
  );
  const repeatLabel: Record<RepeatChoice, string> = {
    none: copy.workRepeatNone,
    daily: copy.workRepeatDaily,
    xdays: copy.workRepeatEveryDays,
    weekly: copy.workRepeatWeekly,
    xweeks: copy.workRepeatEveryWeeks,
    monthly: copy.workRepeatMonthly,
  };
  const endLabel: Record<EndChoice, string> = { never: copy.workEndsNever, count: copy.workEndsCount, until: copy.workEndsUntil };
  const start = parseClock(draft.startText);
  const end = parseClock(draft.endText);
  const overnight = start !== null && end !== null && end <= start;
  const dateLine = editing
    ? longDate(locale, editing.occurrence.dateKey)
    : copy.workFormStartsOn.replace("{date}", longDate(locale, draft.startDateKey));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} accessibilityRole="button">
            <Text style={[styles.headerButton, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{editing
              ? forGroup ? copy.groupItemEditTitle : copy.workFormEditTitle
              : forGroup ? copy.groupItemNewTitle : copy.workFormNewTitle}</Text>
          <TouchableOpacity onPress={handleSave} accessibilityRole="button">
            <Text style={[styles.headerButton, styles.save, { color: theme.accent }]}>{copy.workFormSave}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={[styles.dateLine, { color: theme.mutedText }]}>{dateLine}</Text>
          {error ? <Text style={[styles.error, { color: theme.danger }]}>{copy[error]}</Text> : null}

          {onComplete ? (
            <TouchableOpacity style={[styles.primary, { backgroundColor: theme.success }]} onPress={onComplete} accessibilityRole="button">
              <Text style={[styles.primaryText, { color: theme.accentText }]}>✓ {forGroup ? copy.groupItemMarkDone : copy.workMarkDone}</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={[styles.label, { color: theme.text }]}>{copy.workFormName}</Text>
          <TextInput
            style={inputStyle}
            value={draft.name}
            onChangeText={(name) => update({ name })}
            placeholder={forGroup ? copy.groupItemNamePlaceholder : copy.workFormNamePlaceholder}
            placeholderTextColor={theme.mutedText}
          />

          <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskDescription}</Text>
          <TextInput
            style={[inputStyle, styles.textArea]}
            value={draft.description}
            onChangeText={(description) => update({ description })}
            placeholder={copy.workFormDescriptionPlaceholder}
            placeholderTextColor={theme.mutedText}
            multiline
          />

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.workFormStartTime}</Text>
              <TextInput style={inputStyle} value={draft.startText} onChangeText={(startText) => update({ startText })} placeholder="09:00" placeholderTextColor={theme.mutedText} maxLength={5} />
            </View>
            <View style={styles.timeField}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.workFormEndTime}</Text>
              <TextInput style={inputStyle} value={draft.endText} onChangeText={(endText) => update({ endText })} placeholder="17:00" placeholderTextColor={theme.mutedText} maxLength={5} />
            </View>
          </View>
          {overnight ? <Text style={[styles.hint, { color: theme.mutedText }]}>{copy.workFormOvernight}</Text> : null}

          <Text style={[styles.label, { color: theme.text }]}>{copy.tasksCalendarColor}</Text>
          <View style={styles.row}>
            {taskCalendarColors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.swatch, { backgroundColor: color, borderColor: draft.calendarColor === color ? theme.text : theme.surface }]}
                onPress={() => update({ calendarColor: color })}
                accessibilityRole="button"
                accessibilityState={{ selected: draft.calendarColor === color }}
              />
            ))}
          </View>

          <Text style={[styles.label, { color: theme.text }]}>{copy.workFormRepeat}</Text>
          <View style={styles.row}>
            {REPEAT_CHOICES.map((choice) => chip(choice, repeatLabel[choice], draft.repeatChoice === choice, () => update({ repeatChoice: choice })))}
          </View>

          {draft.repeatChoice === "xdays" || draft.repeatChoice === "xweeks" ? (
            <View style={styles.inlineRow}>
              <Text style={[styles.inlineText, { color: theme.text }]}>{copy.workFormEvery}</Text>
              <TextInput style={[inputStyle, styles.numberInput]} value={draft.intervalText} onChangeText={(intervalText) => update({ intervalText })} keyboardType="number-pad" maxLength={3} />
              <Text style={[styles.inlineText, { color: theme.text }]}>{draft.repeatChoice === "xdays" ? copy.workFormDays : copy.workFormWeeks}</Text>
            </View>
          ) : null}

          {draft.repeatChoice === "weekly" || draft.repeatChoice === "xweeks" ? (
            <>
              <Text style={[styles.subLabel, { color: theme.mutedText }]}>{copy.workFormOnDays}</Text>
              <View style={styles.row}>
                {WEEKDAYS_MONDAY_FIRST.map((weekday) =>
                  chip(String(weekday), weekdayLabel(locale, weekday), draft.weekdays.includes(weekday), () =>
                    update({
                      weekdays: draft.weekdays.includes(weekday)
                        ? draft.weekdays.filter((day) => day !== weekday)
                        : [...draft.weekdays, weekday],
                    }),
                  ),
                )}
              </View>
            </>
          ) : null}

          {draft.repeatChoice !== "none" ? (
            <>
              <Text style={[styles.label, { color: theme.text }]}>{copy.workFormEndsRule}</Text>
              <View style={styles.row}>
                {END_CHOICES.map((choice) => chip(choice, endLabel[choice], draft.endChoice === choice, () => update({ endChoice: choice })))}
              </View>
              {draft.endChoice === "count" ? (
                <View style={styles.inlineRow}>
                  <TextInput style={[inputStyle, styles.numberInput]} value={draft.countText} onChangeText={(countText) => update({ countText })} keyboardType="number-pad" maxLength={4} />
                  <Text style={[styles.inlineText, { color: theme.text }]}>{copy.workFormTimes}</Text>
                </View>
              ) : null}
              {draft.endChoice === "until" ? (
                <View style={styles.datePicker}>
                  <TaskDatePicker
                    settings={settings}
                    value={dateKeyToStart(draft.untilDateKey)}
                    onChange={(date) => update({ untilDateKey: toDateKey(date) })}
                  />
                </View>
              ) : null}
            </>
          ) : null}

          {editing ? (
            <View style={styles.deleteRow}>
              {confirmingDelete ? (
                <TouchableOpacity style={[styles.secondary, { backgroundColor: theme.surfaceMuted }]} onPress={() => setConfirmingDelete(false)} accessibilityRole="button">
                  <Text style={[styles.primaryText, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={[styles.primary, styles.deleteButton, { backgroundColor: theme.danger }]} onPress={handleDelete} accessibilityRole="button">
                <Text style={[styles.primaryText, styles.deleteText]}>{confirmingDelete ? copy.tasksConfirmDelete : copy.tasksDelete}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>

        {prompt && editing ? (
          <WorkScopePrompt
            settings={settings}
            action={prompt.action}
            followingOnly={prompt.fields ? changesSeriesRule(editing.item, prompt.fields) : false}
            onChoose={handleScope}
            onCancel={() => setPrompt(null)}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: { fontSize: 14 },
  save: { fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "600" },
  form: { padding: 16, paddingBottom: 40 },
  dateLine: { fontSize: 14, marginBottom: 8 },
  error: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  subLabel: { fontSize: 13, marginTop: 12, marginBottom: 8 },
  hint: { fontSize: 13, marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  timeRow: { flexDirection: "row", gap: 12 },
  timeField: { flex: 1 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: "600" },
  swatch: { width: 34, height: 34, borderRadius: 999, borderWidth: 3 },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  inlineText: { fontSize: 14 },
  numberInput: { width: 64, textAlign: "center" },
  datePicker: { marginTop: 12 },
  primary: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", marginTop: 8 },
  secondary: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  primaryText: { fontSize: 15, fontWeight: "700" },
  deleteRow: { flexDirection: "row", gap: 12, marginTop: 28 },
  deleteButton: { flex: 1 },
  deleteText: { color: "#fff" },
});
