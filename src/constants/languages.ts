import { AppLanguage } from "../types";

/** Every language the app ships, in the order Settings lists them. */
export const APP_LANGUAGES: readonly AppLanguage[] = ["en", "pt", "es", "fr", "de", "it", "ru", "tr", "id", "ja", "ko", "zh"];

/** Each language named in its own language, for the Settings picker. */
export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ru: "Русский",
  tr: "Türkçe",
  id: "Bahasa Indonesia",
  ja: "日本語",
  ko: "한국어",
  zh: "简体中文",
};

/** The locale used for dates and numbers in each language. */
export const LANGUAGE_LOCALES: Record<AppLanguage, string> = {
  en: "en-US",
  pt: "pt-PT",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  ru: "ru-RU",
  tr: "tr-TR",
  id: "id-ID",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === "string" && (APP_LANGUAGES as readonly string[]).includes(value);
}

/** "pt-BR" → "pt", "zh_Hans_CN" → "zh"; anything unsupported → null. */
export function resolveLanguage(tag: string | null | undefined): AppLanguage | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split(/[-_]/)[0];
  return isAppLanguage(base) ? base : null;
}

/** The phone's language when the app ships it, else English. Used for a brand-new save. */
export function deviceLanguage(): AppLanguage {
  try {
    const nav = (globalThis as { navigator?: { languages?: readonly string[]; language?: string } }).navigator;
    const tags = [...(nav?.languages ?? []), nav?.language, Intl.DateTimeFormat().resolvedOptions().locale];
    for (const tag of tags) {
      const language = resolveLanguage(tag);
      if (language) return language;
    }
  } catch {
    // No Intl or navigator: fall through to English.
  }
  return "en";
}
