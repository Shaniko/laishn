import { useTranslation } from "react-i18next";
import { he, enUS, ru } from "date-fns/locale";
import type { Locale } from "date-fns";

const localeMap: Record<string, Locale> = { he, en: enUS, ru };

export function useDateLocale() {
  const { i18n } = useTranslation();
  return localeMap[i18n.language] || he;
}

export function useDirection() {
  const { i18n } = useTranslation();
  return i18n.language === "he" ? "rtl" as const : "ltr" as const;
}
