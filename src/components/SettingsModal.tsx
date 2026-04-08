import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { appThemes, getAppTheme } from "../constants/appTheme";
import { getChangelog } from "../constants/changelog";
import { AppLanguage, AppThemeId, GameState, TimerAlertMode } from "../types";
import { getGameStatsSummary } from "../utils/settings";

interface SettingsModalProps {
  visible: boolean;
  gameState: GameState;
  onClose: () => void;
  onLanguageChange: (language: AppLanguage) => void;
  onThemeChange: (theme: AppThemeId) => void;
  onTimerAlertModeChange: (mode: TimerAlertMode) => void;
  onPickTimerAlertSound: () => Promise<void>;
  onClearTimerAlertSound: () => Promise<void>;
  onExportData: () => Promise<string>;
  onImportData: (backupCode: string) => Promise<void>;
}

export default function SettingsModal({
  visible,
  gameState,
  onClose,
  onLanguageChange,
  onThemeChange,
  onTimerAlertModeChange,
  onPickTimerAlertSound,
  onClearTimerAlertSound,
  onExportData,
  onImportData,
}: SettingsModalProps) {
  const copy = getAppCopy(gameState.settings.language);
  const theme = getAppTheme(gameState.settings.theme);
  const changelog = getChangelog(gameState.settings.language);
  const stats = getGameStatsSummary(gameState);
  const [backupCode, setBackupCode] = useState("");
  const [changelogVisible, setChangelogVisible] = useState(false);

  const handleExport = async () => {
    const exportedBackupCode = await onExportData();
    setBackupCode(exportedBackupCode);
    Alert.alert(copy.settingsTitle, copy.settingsBackupExported);
  };

  const handleImport = async () => {
    try {
      await onImportData(backupCode);
      Alert.alert(copy.settingsTitle, copy.settingsBackupImported);
    } catch {
      Alert.alert(copy.settingsTitle, copy.settingsBackupInvalid);
    }
  };

  const handlePickTimerAlertSound = async () => {
    try {
      await onPickTimerAlertSound();
    } catch (error) {
      console.error("Failed to pick timer alert sound:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>{copy.settingsTitle}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: theme.accent }]}>{copy.settingsClose}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.settingsLanguage}</Text>
            <View style={styles.optionRow}>
              <OptionButton
                label={copy.settingsLanguageEnglish}
                active={gameState.settings.language === "en"}
                onPress={() => onLanguageChange("en")}
                themeId={theme.id}
              />
              <OptionButton
                label={copy.settingsLanguagePortuguese}
                active={gameState.settings.language === "pt"}
                onPress={() => onLanguageChange("pt")}
                themeId={theme.id}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.settingsTheme}</Text>
            <View style={styles.themeList}>
              {Object.values(appThemes).map((themeOption) => (
                <TouchableOpacity
                  key={themeOption.id}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: themeOption.surfaceMuted,
                      borderColor:
                        gameState.settings.theme === themeOption.id
                          ? theme.accent
                          : theme.border,
                    },
                  ]}
                  onPress={() => onThemeChange(themeOption.id)}
                >
                  <View style={[styles.themePreview, { backgroundColor: themeOption.hero }]} />
                  <Text style={[styles.themeName, { color: themeOption.text }]}>{themeOption.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.settingsTimerAlert}</Text>
            <View style={styles.optionRow}>
              <OptionButton
                label={copy.settingsTimerAlertVibration}
                active={gameState.settings.timerAlert.mode === "vibration"}
                onPress={() => onTimerAlertModeChange("vibration")}
                themeId={theme.id}
              />
              <OptionButton
                label={copy.settingsTimerAlertSound}
                active={gameState.settings.timerAlert.mode === "sound"}
                onPress={() => onTimerAlertModeChange("sound")}
                themeId={theme.id}
              />
            </View>
            <View style={[styles.soundCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
              <Text style={[styles.soundName, { color: theme.text }]}>
                {gameState.settings.timerAlert.soundName
                  ? gameState.settings.timerAlert.soundName
                  : copy.settingsTimerAlertNoSound}
              </Text>
              <View style={styles.optionRow}>
                <OptionButton
                  label={copy.settingsTimerAlertChooseSound}
                  active
                  onPress={handlePickTimerAlertSound}
                  themeId={theme.id}
                />
                <OptionButton
                  label={copy.settingsTimerAlertClearSound}
                  active={false}
                  onPress={onClearTimerAlertSound}
                  themeId={theme.id}
                />
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.settingsStats}</Text>
            <StatRow label={copy.settingsTotalTasks} value={String(stats.totalTasksCompleted)} themeId={theme.id} />
            <StatRow label={copy.settingsUncompletedTasks} value={String(stats.uncompletedTasks)} themeId={theme.id} />
            <StatRow label={copy.settingsTodayActiveTasks} value={String(stats.todayActiveTasks)} themeId={theme.id} />
            <StatRow label={copy.settingsTotalPets} value={String(stats.totalPets)} themeId={theme.id} />
            <StatRow label={copy.settingsCommonPets} value={String(stats.commonPets)} themeId={theme.id} />
            <StatRow label={copy.settingsRarePets} value={String(stats.rarePets)} themeId={theme.id} />
            <StatRow label={copy.settingsEpicPets} value={String(stats.epicPets)} themeId={theme.id} />
            <StatRow label={copy.settingsFusedPets} value={String(stats.fusedPets)} themeId={theme.id} />
            <StatRow label={copy.settingsEquippedPet} value={stats.equippedPetName} themeId={theme.id} />
            <StatRow label={copy.dashboardCoins} value={String(gameState.coins)} themeId={theme.id} />
            <StatRow label={copy.dashboardPityCurrency} value={String(gameState.pityCurrency)} themeId={theme.id} />
            <StatRow label={copy.dashboardPlayerLevel} value={String(gameState.level)} themeId={theme.id} />
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.settingsBackup}</Text>
            <Text style={[styles.helpText, { color: theme.mutedText }]}>{copy.settingsBackupHelp}</Text>
            <TextInput
              style={[
                styles.backupInput,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              multiline
              numberOfLines={5}
              value={backupCode}
              onChangeText={setBackupCode}
              placeholder={copy.settingsBackupPlaceholder}
              placeholderTextColor={theme.mutedText}
            />
            <View style={styles.optionRow}>
              <OptionButton
                label={copy.settingsExport}
                active
                onPress={handleExport}
                themeId={theme.id}
              />
              <OptionButton
                label={copy.settingsImport}
                active={false}
                onPress={handleImport}
                themeId={theme.id}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.settingsChangelog}</Text>
            <TouchableOpacity
              style={[
                styles.changelogToggleButton,
                {
                  backgroundColor: changelogVisible
                    ? theme.accent
                    : theme.surfaceMuted,
                  borderColor: changelogVisible ? theme.accent : theme.border,
                },
              ]}
              onPress={() => setChangelogVisible(!changelogVisible)}
            >
              <Text
                style={[
                  styles.changelogToggleText,
                  { color: changelogVisible ? theme.accentText : theme.text },
                ]}
              >
                {changelogVisible
                  ? copy.settingsHideChangelog
                  : copy.settingsViewChangelog}
              </Text>
            </TouchableOpacity>
            {changelogVisible && (
              <View style={styles.changelogList}>
                {changelog.map((entry) => (
                  <View
                    key={entry.dateLabel}
                    style={[
                      styles.changelogCard,
                      {
                        backgroundColor: theme.surfaceMuted,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.changelogDate, { color: theme.text }]}>
                      {copy.settingsUpdatedOn}: {entry.dateLabel}
                    </Text>
                    <View style={styles.changelogItems}>
                      {entry.items.map((item) => (
                        <View key={item} style={styles.changelogRow}>
                          <Text style={[styles.changelogBullet, { color: theme.accent }]}>•</Text>
                          <Text style={[styles.changelogItem, { color: theme.mutedText }]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function OptionButton({
  label,
  active,
  onPress,
  themeId,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  themeId: AppThemeId;
}) {
  const theme = getAppTheme(themeId);

  return (
    <TouchableOpacity
      style={[
        styles.optionButton,
        {
          backgroundColor: active ? theme.accent : theme.surfaceMuted,
          borderColor: active ? theme.accent : theme.border,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.optionButtonText, { color: active ? theme.accentText : theme.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatRow({
  label,
  value,
  themeId,
}: {
  label: string;
  value: string;
  themeId: AppThemeId;
}) {
  const theme = getAppTheme(themeId);

  return (
    <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
      <Text style={[styles.statLabel, { color: theme.mutedText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  closeButton: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    gap: 14,
  },
  section: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  soundCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  soundName: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  helpText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  backupInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlignVertical: "top",
    marginBottom: 12,
    fontSize: 13,
  },
  changelogCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  changelogToggleButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  changelogToggleText: {
    fontSize: 14,
    fontWeight: "700",
  },
  changelogDate: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  changelogList: {
    marginTop: 12,
    gap: 12,
  },
  changelogItems: {
    gap: 8,
  },
  changelogRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  changelogBullet: {
    fontSize: 16,
    marginRight: 8,
    lineHeight: 18,
  },
  changelogItem: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  themeList: {
    gap: 10,
  },
  themeCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  themePreview: {
    width: 28,
    height: 28,
    borderRadius: 999,
  },
  themeName: {
    fontSize: 15,
    fontWeight: "700",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
  },
});
