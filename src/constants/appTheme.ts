import { AppAppearance, AppThemeId } from "../types";

export interface AppTheme {
  id: AppThemeId;
  name: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  hero: string;
  heroText: string;
  heroMuted: string;
  success: string;
  warning: string;
  warningSoft: string;
  danger: string;
}

export const appThemes: Record<AppThemeId, AppTheme> = {
  mint: {
    id: "mint",
    name: "Mint",
    background: "#f4f8f7",
    surface: "#ffffff",
    surfaceMuted: "#eef5f3",
    text: "#1f2b2a",
    mutedText: "#667270",
    border: "#d9e3e0",
    accent: "#1f7a73",
    accentSoft: "#dff5f1",
    accentText: "#ffffff",
    hero: "#1f7a73",
    heroText: "#ffffff",
    heroMuted: "#d3fffa",
    success: "#2ca58d",
    warning: "#f39c12",
    warningSoft: "#f8e1b7",
    danger: "#d35454",
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    background: "#fff6f0",
    surface: "#ffffff",
    surfaceMuted: "#fff0e4",
    text: "#3a2720",
    mutedText: "#8a6a5d",
    border: "#f0d7c8",
    accent: "#c05a2f",
    accentSoft: "#ffe0d0",
    accentText: "#ffffff",
    hero: "#b55329",
    heroText: "#ffffff",
    heroMuted: "#ffe6d9",
    success: "#c8742f",
    warning: "#e29b1d",
    warningSoft: "#f7e0b7",
    danger: "#c94c4c",
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    background: "#f1f6fb",
    surface: "#ffffff",
    surfaceMuted: "#e6eef6",
    text: "#1d2d3f",
    mutedText: "#6a7b8c",
    border: "#d5dfeb",
    accent: "#2d6ea8",
    accentSoft: "#dbeafe",
    accentText: "#ffffff",
    hero: "#275d90",
    heroText: "#ffffff",
    heroMuted: "#d9ecff",
    success: "#2d8ca8",
    warning: "#d48a1d",
    warningSoft: "#f1dfbb",
    danger: "#bf5b5b",
  },
  dusk: {
    id: "dusk",
    name: "Dusk",
    background: "#f3f1fa",
    surface: "#ffffff",
    surfaceMuted: "#ece8f7",
    text: "#2a2540",
    mutedText: "#6b6585",
    border: "#ddd7ee",
    accent: "#6c4fc4",
    accentSoft: "#e9e2fb",
    accentText: "#ffffff",
    hero: "#5a3fb0",
    heroText: "#ffffff",
    heroMuted: "#e3d9ff",
    success: "#2ca58d",
    warning: "#f39c12",
    warningSoft: "#f8e1b7",
    danger: "#d35454",
  },
  blossom: {
    id: "blossom",
    name: "Blossom",
    background: "#fff5f8",
    surface: "#ffffff",
    surfaceMuted: "#ffe9f0",
    text: "#3a2430",
    mutedText: "#86677a",
    border: "#f3d6e1",
    accent: "#d0567f",
    accentSoft: "#ffe0eb",
    accentText: "#ffffff",
    hero: "#c94a76",
    heroText: "#ffffff",
    heroMuted: "#ffd9e7",
    success: "#2ca58d",
    warning: "#f39c12",
    warningSoft: "#f8e1b7",
    danger: "#d35454",
  },
  forest: {
    id: "forest",
    name: "Forest",
    background: "#f2f6ef",
    surface: "#ffffff",
    surfaceMuted: "#e7efe1",
    text: "#1f2a1c",
    mutedText: "#5f6f5a",
    border: "#d5e0cd",
    accent: "#3f7a35",
    accentSoft: "#dfeed8",
    accentText: "#ffffff",
    hero: "#356b2c",
    heroText: "#ffffff",
    heroMuted: "#d6f0cd",
    success: "#2ca58d",
    warning: "#f39c12",
    warningSoft: "#f8e1b7",
    danger: "#d35454",
  },
};


/**
 * Dark versions of each theme: same identity and accent hue on dark surfaces. Accents are tuned so
 * white button text and the accent on the dark background both reach about 4:1 contrast.
 */
const darkThemeColors: Record<AppThemeId, Omit<AppTheme, "id" | "name">> = {
  mint: {
    background: "#0f1716",
    surface: "#172220",
    surfaceMuted: "#1d2b28",
    text: "#e6efed",
    mutedText: "#9aaba8",
    border: "#2a3a37",
    accent: "#238f86",
    accentSoft: "#1d3a36",
    accentText: "#ffffff",
    hero: "#1c4f4a",
    heroText: "#ffffff",
    heroMuted: "#bfeee8",
    success: "#4cc9a8",
    warning: "#f5b041",
    warningSoft: "#3d2f17",
    danger: "#e57373",
  },
  sunset: {
    background: "#18110e",
    surface: "#221815",
    surfaceMuted: "#2c1f1a",
    text: "#f3e6df",
    mutedText: "#b39a8e",
    border: "#3d2b24",
    accent: "#c0603a",
    accentSoft: "#3d2419",
    accentText: "#ffffff",
    hero: "#5a2d1a",
    heroText: "#ffffff",
    heroMuted: "#ffd9c7",
    success: "#e0a060",
    warning: "#eab04a",
    warningSoft: "#3d2f17",
    danger: "#e57373",
  },
  ocean: {
    background: "#0e141b",
    surface: "#151e28",
    surfaceMuted: "#1b2734",
    text: "#e3ebf3",
    mutedText: "#94a6b8",
    border: "#263646",
    accent: "#3a7fc0",
    accentSoft: "#1a2d42",
    accentText: "#ffffff",
    hero: "#1d3d5e",
    heroText: "#ffffff",
    heroMuted: "#cfe5ff",
    success: "#4fb3cf",
    warning: "#e6a23c",
    warningSoft: "#3a2d16",
    danger: "#e07a7a",
  },
  dusk: {
    background: "#13111c",
    surface: "#1b1826",
    surfaceMuted: "#231f33",
    text: "#ebe7f7",
    mutedText: "#a39cbd",
    border: "#312b47",
    accent: "#7d62d9",
    accentSoft: "#2a2346",
    accentText: "#ffffff",
    hero: "#3a2a78",
    heroText: "#ffffff",
    heroMuted: "#ddd2ff",
    success: "#4cc9a8",
    warning: "#f5b041",
    warningSoft: "#3d2f17",
    danger: "#e57373",
  },
  blossom: {
    background: "#1a1015",
    surface: "#24171e",
    surfaceMuted: "#2e1d27",
    text: "#f5e6ed",
    mutedText: "#b896a8",
    border: "#42293a",
    accent: "#c84f7f",
    accentSoft: "#43202f",
    accentText: "#ffffff",
    hero: "#6a2944",
    heroText: "#ffffff",
    heroMuted: "#ffd3e3",
    success: "#4cc9a8",
    warning: "#f5b041",
    warningSoft: "#3d2f17",
    danger: "#e57373",
  },
  forest: {
    background: "#10150e",
    surface: "#182015",
    surfaceMuted: "#1f2a1b",
    text: "#e6eee2",
    mutedText: "#9cab95",
    border: "#2c3a27",
    accent: "#468c3a",
    accentSoft: "#22371e",
    accentText: "#ffffff",
    hero: "#2c4f25",
    heroText: "#ffffff",
    heroMuted: "#d1ecc8",
    success: "#4cc9a8",
    warning: "#f5b041",
    warningSoft: "#3d2f17",
    danger: "#e57373",
  },
};

export const appDarkThemes: Record<AppThemeId, AppTheme> = Object.fromEntries(
  (Object.keys(appThemes) as AppThemeId[]).map((id) => [id, { ...appThemes[id], ...darkThemeColors[id] }])
) as Record<AppThemeId, AppTheme>;

/**
 * Whether the dark palette is active. Set once per render at the app root (setDarkAppearance in
 * App.tsx, from settings.appearance and the phone's color scheme) before any screen reads a theme,
 * so the many getAppTheme(settings.theme) call sites switch without each knowing about dark mode.
 */
let darkActive = false;

export function setDarkAppearance(dark: boolean): void {
  darkActive = dark;
}

export function isDarkAppearance(): boolean {
  return darkActive;
}

/** Resolves the appearance setting against the phone's scheme ("dark" | "light" | null). */
export function resolveDarkAppearance(appearance: AppAppearance, systemScheme: string | null | undefined): boolean {
  if (appearance === "dark") return true;
  if (appearance === "light") return false;
  return systemScheme === "dark";
}

export function getAppTheme(themeId: AppThemeId): AppTheme {
  return darkActive ? appDarkThemes[themeId] : appThemes[themeId];
}
