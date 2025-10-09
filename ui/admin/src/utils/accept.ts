// utils/accept.ts
export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const accepts = accept.split(",").map(a => a.trim().toLowerCase());
  const mime = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();

  return accepts.some(rule => {
    if (rule.startsWith(".")) return name.endsWith(rule);        // .png
    if (rule.endsWith("/*")) {                                   // image/*
      const base = rule.slice(0, -2);
      return mime.startsWith(base + "/");
    }
    return mime === rule;                                        // image/png ou application/pdf
  });
}