export function tryParseJson<T  extends object>(
  raw: string | null | undefined,
  defaultValue: T
): T {
  if (!raw || raw.trim() === "") return defaultValue;

  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return defaultValue;

    // checa: todas as chaves do default existem e têm o mesmo "typeof"
    for (const k of Object.keys(defaultValue) as (keyof T)[]) {
      const expected = defaultValue[k];
      const got = (parsed as Record<string, unknown>)[k as string];

      if (got === undefined) return defaultValue;

      const expectedIsArray = Array.isArray(expected);
      const gotIsArray = Array.isArray(got);
      if (expectedIsArray || gotIsArray) {
        if (!expectedIsArray || !gotIsArray) return defaultValue;
        continue; // ambos arrays -> ok (shallow)
      }

      if (typeof got !== typeof expected) return defaultValue;
    }

    // monta só com as chaves esperadas (ignora extras)
    const out = { ...defaultValue } as T;
    for (const k of Object.keys(defaultValue) as (keyof T)[]) {
      (out as any)[k as string] = (parsed as any)[k as string];
    }
    return out;
  } catch {
    return defaultValue;
  }
}
