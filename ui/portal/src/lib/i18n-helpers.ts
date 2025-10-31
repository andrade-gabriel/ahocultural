// src/lib/i18n-helpers.ts

export type LangCode = "pt" | "en" | "es";

// Garante LangCode a partir da sua hook/useLang (string qualquer)
export function asLangCode(v: string | undefined | null): LangCode {
  const base = (v ?? "pt").split("-")[0].toLowerCase();
  return (["pt", "en", "es"] as const).includes(base as LangCode)
    ? (base as LangCode)
    : "pt";
}

// Dicionário i18n "solto": aceita chaves parciais (pt/en/es) e qualquer outra
export type I18nDict<T = string> = Partial<Record<LangCode, T>> & Record<string, T | undefined>;

// Valor i18n aceito pelos helpers (string, dict parcial, nulo/undefined)
export type I18nLike = string | I18nDict<string> | null | undefined;

const norm = (s?: string | null) => (s ?? "").toString().trim().toLowerCase();

// labelFrom: pega o valor no idioma atual, fallback em pt, depois primeira chave do objeto
export function labelFrom(value: I18nLike, lang: LangCode, fallback = ""): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;

  const dict = value as I18nDict<string>;
  const byLang = dict[lang];
  if (typeof byLang === "string" && byLang.length > 0) return byLang;

  const pt = dict["pt"];
  if (typeof pt === "string" && pt.length > 0) return pt;

  // primeira entrada não vazia
  for (const k of Object.keys(dict)) {
    const v = dict[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return fallback;
}

// slugFrom: mesmo critério do labelFrom + normalização
export function slugFrom(value: I18nLike, lang: LangCode): string {
  return norm(labelFrom(value, lang, ""));
}

export { norm }; // útil em alguns pontos