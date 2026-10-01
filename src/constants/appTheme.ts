import { AppThemeId } from "../types";

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

export function getAppTheme(themeId: AppThemeId): AppTheme {
  return appThemes[themeId];
}
