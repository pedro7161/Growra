import React from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { gameStateService } from "../services/gameStateService";
import { AppLanguage } from "../types";

interface AppErrorBoundaryState {
  failed: boolean;
  language: AppLanguage;
  /** Bumped by Restart so the app below remounts and loads the save again. */
  attempt: number;
}

/**
 * Catches a render error anywhere in the app. Without it one throw (for example from a broken
 * save) leaves a white screen whose only way out is reinstalling, which deletes the save.
 */
export default class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false, language: "en", attempt: 0 };

  static getDerivedStateFromError(): Partial<AppErrorBoundaryState> {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Growra crashed:", error);
    void gameStateService.readStoredLanguage().then((language) => {
      if (language === "pt" || language === "en") this.setState({ language });
    });
  }

  private restart = () => {
    this.setState((state) => ({ failed: false, attempt: state.attempt + 1 }));
  };

  private shareBackup = async () => {
    const code = await gameStateService.readStoredSaveForSharing();
    if (code) await Share.share({ message: code }).catch(() => undefined);
  };

  render() {
    if (!this.state.failed) {
      return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
    }

    const copy = getAppCopy(this.state.language);
    const theme = getAppTheme("mint");

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>{copy.crashTitle}</Text>
        <Text style={[styles.body, { color: theme.mutedText }]}>{copy.crashBody}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={this.restart} accessibilityRole="button">
          <Text style={[styles.buttonText, { color: theme.accentText }]}>{copy.crashRestart}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondary, { borderColor: theme.accent }]}
          onPress={() => void this.shareBackup()}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { color: theme.accent }]}>{copy.crashShareBackup}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  body: { fontSize: 15, lineHeight: 21, textAlign: "center", marginBottom: 8 },
  button: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  secondary: { borderWidth: 1.5 },
  buttonText: { fontSize: 16, fontWeight: "700" },
});
