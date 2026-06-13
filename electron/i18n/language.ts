import path from "path";
import jetpack from "fs-jetpack";
import { localAppDir } from "../utils/import-before-all-import.ts";

export type AppLanguage = "en" | "zh";

export const languageChangedEvent = "language-changed";
export const languageConfigPath = path.join(localAppDir, "language.json");

export const normalizeLanguage = (language: unknown): AppLanguage => (language === "zh" ? "zh" : "en");

export const getCurrentLanguage = (): AppLanguage => {
  const config = jetpack.read(languageConfigPath, "json") as { language?: unknown } | undefined;
  return normalizeLanguage(config?.language);
};

export const writeCurrentLanguage = (language: AppLanguage) => {
  const nextLanguage = normalizeLanguage(language);
  jetpack.dir(localAppDir);
  jetpack.write(languageConfigPath, { language: nextLanguage }, { atomic: true });
  return nextLanguage;
};

export const getProductName = (language: AppLanguage = getCurrentLanguage()) =>
  language === "zh" ? "本软件" : "Replay";

export const getWindowTitle = (isSettingsWindow = false, language: AppLanguage = getCurrentLanguage()) => {
  if (language === "zh") {
    return isSettingsWindow ? "设置" : getProductName(language);
  }
  return isSettingsWindow ? "Settings" : getProductName(language);
};

export const getWindowTitleFromUrl = (url: string, language: AppLanguage = getCurrentLanguage()) =>
  getWindowTitle(url.includes("settings=true"), language);
