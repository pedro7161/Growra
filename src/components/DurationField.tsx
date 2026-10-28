import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { taskDurationOptions } from "../constants/taskConfig";
import { AppSettings } from "../types";
import {
  DurationUnit,
  durationToInput,
  formatTaskDuration,
  parseTaskDuration,
} from "../utils/taskDuration";

const UNITS: DurationUnit[] = ["seconds", "minutes", "hours"];

interface DurationFieldProps {
  settings: AppSettings;
  copy: AppCopy;
  /** Current length in minutes; null/undefined = none. */
  minutes: number | null | undefined;
  onChange: (minutes: number | null) => void;
  disabled?: boolean;
}

/** "How long?": quick-pick chips plus a typed number and a seconds/minutes/hours selector. */
export default function DurationField({ settings, copy, minutes, onChange, disabled = false }: DurationFieldProps) {
  const theme = getAppTheme(settings.theme);
  const units = {
    seconds: copy.tasksDurationSecondsUnit,
    minutes: copy.tasksDurationMinutesUnit,
    hours: copy.tasksDurationHoursUnit,
  };
  const [input, setInput] = useState(() => durationToInput(minutes));

  // A chip pick or reopened task changes the length from outside: show it in the best unit.
  useEffect(() => {
    if (parseTaskDuration(input.value, input.unit) !== (minutes || null)) {
      setInput(durationToInput(minutes));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes]);

  const unitLabel = (unit: DurationUnit) => units[unit];

  const update = (value: string, unit: DurationUnit) => {
    setInput({ value, unit });
    onChange(parseTaskDuration(value, unit));
  };

  const chip = (label: string, active: boolean, onPress: () => void, key: string) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.chip,
        { backgroundColor: active ? theme.accent : theme.surfaceMuted, borderColor: active ? theme.accent : theme.border },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.chipText, { color: active ? theme.accentText : theme.mutedText }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={styles.row}>
        {chip(copy.tasksDurationNone, !minutes, () => onChange(null), "none")}
        {taskDurationOptions.map((option) =>
          chip(formatTaskDuration(option, units), minutes === option, () => onChange(option), String(option)),
        )}
      </View>
      <View style={[styles.customRow]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          value={input.value}
          onChangeText={(value) => update(value, input.unit)}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.mutedText}
          editable={!disabled}
          maxLength={6}
        />
        <View style={styles.units}>
          {UNITS.map((unit) => {
            const active = input.unit === unit;
            return (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.unit,
                  { backgroundColor: active ? theme.accent : theme.surfaceMuted, borderColor: active ? theme.accent : theme.border },
                ]}
                onPress={() => update(input.value, unit)}
                disabled={disabled}
              >
                <Text style={[styles.chipText, { color: active ? theme.accentText : theme.mutedText }]}>
                  {unitLabel(unit)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  chipText: { fontSize: 12, fontWeight: "600" },
  customRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  input: {
    width: 90,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  units: { flexDirection: "row", gap: 6 },
  unit: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
});
