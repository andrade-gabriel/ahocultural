// src/lib/i18n-utils.ts
export type LangCode = "pt" | "en" | "es";
type I18nDict<T = string | null | undefined> = Record<LangCode, T>;

export const toLangCode = (i18nLang?: string): LangCode => {
  const base = (i18nLang || "pt").split("-")[0].toLowerCase();
  if (base === "en") return "en";
  if (base === "es") return "es";
  return "pt";
};

export const fallbackOrder = (lang: LangCode): LangCode[] => {
  if (lang === "en") return ["en", "pt", "es"];
  if (lang === "es") return ["es", "pt", "en"];
  return ["pt", "en", "es"];
};

export function pickI18n<T extends string>(
  obj: I18nDict<T>,
  lang: LangCode,
  extraFallbacks: LangCode[] = []
): T {
  const order = [...fallbackOrder(lang), ...extraFallbacks];
  for (const code of order) {
    const val = obj?.[code];
    if (val && String(val).trim()) return val;
  }
  // último recurso: primeiro valor não-vazio
  const first = (["pt","en","es"] as LangCode[]).map(c => obj?.[c]).find(v => v && String(v).trim());
  return (first ?? "") as T;
}

export function pickI18nNullable(
  obj: I18nDict<string | null | undefined> | undefined,
  lang: LangCode,
  extraFallbacks: LangCode[] = []
): string | undefined {
  if (!obj) return undefined;
  const order = [...fallbackOrder(lang), ...extraFallbacks];
  for (const code of order) {
    const val = obj?.[code];
    if (val && String(val).trim()) return val;
  }
  return undefined;
}
