type TypeHint = "string" | "number" | "boolean" | "object" | "array" | "date";
type Hints<T> = Partial<Record<keyof T, TypeHint>>;

function isDate(v: unknown): v is Date {
  return v instanceof Date || (typeof v === "string" && !isNaN(Date.parse(v)));
}

export function tryParseJson<T extends object>(
  raw: string | null | undefined,
  defaultValue: T,
  hints?: Hints<T>
): T {
  if (!raw || raw.trim() === "") return defaultValue;

  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return defaultValue;

    for (const k of Object.keys(defaultValue) as (keyof T)[]) {
      const expected = defaultValue[k];
      const got = (parsed as Record<string, unknown>)[k as string];

      if (got === undefined) return defaultValue;

      // arrays (shallow)
      const expIsArray = Array.isArray(expected);
      const gotIsArray = Array.isArray(got);
      if (expIsArray || gotIsArray) {
        if (!expIsArray || !gotIsArray) return defaultValue;
        continue;
      }

      // nullables via hints
      if (expected === null) {
        if (got === null) continue;

        const hint = hints?.[k];
        if (!hint) return defaultValue;

        switch (hint) {
          case "array":
            if (!Array.isArray(got)) return defaultValue;
            break;
          case "date":
            if (!isDate(got)) return defaultValue;
            break;
          case "object":
            if (typeof got !== "object") return defaultValue;
            break;
          default:
            if (typeof got !== hint) return defaultValue;
        }
        continue;
      }

      // dates supported via default Date instance
      if (expected instanceof Date) {
        if (!isDate(got)) return defaultValue;
        continue;
      }

      // objetos simples
      if (typeof expected === "object") {
        if (typeof got !== "object" || got === null) return defaultValue;
        continue;
      }

      // primitivos
      if (typeof got !== typeof expected) return defaultValue;
    }

    // monta só com as chaves esperadas
    const out = { ...defaultValue } as T;
    for (const k of Object.keys(defaultValue) as (keyof T)[]) {
      (out as any)[k as string] = (parsed as any)[k as string];
      // normaliza Date se hint ou default indicarem
      if ((defaultValue[k] instanceof Date || hints?.[k] === "date") && out[k] != null) {
        (out as any)[k as string] = new Date(out[k] as any);
      }
    }
    return out;
  } catch {
    return defaultValue;
  }
}