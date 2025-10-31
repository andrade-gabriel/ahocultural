// src/lib/useLang.ts
import { useTranslation } from "react-i18next";
import { toLangCode, type LangCode } from '../lib/i18n-utils'

export function useLang(): LangCode {
  const { i18n } = useTranslation();
  return toLangCode(i18n.language);
}