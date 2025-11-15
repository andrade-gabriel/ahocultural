import { Event } from "./types";

/** Helpers */
function isDefined<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}

function parseDate(value: any): Date {
  if (value instanceof Date) return value;
  return new Date(String(value));
}

function isValidDateValue(value: any): boolean {
  const d = parseDate(value);
  return !isNaN(d.getTime());
}

function validateI18nValue(name: string, value: any, errors: string[]) {
  if (!value) {
    errors.push(`${name} é obrigatório.`);
    return;
  }

  const langs = ["pt", "en", "es"];
  const hasAtLeastOne = langs.some(
    (l) => typeof value[l] === "string" && value[l].trim() !== ""
  );

  if (!hasAtLeastOne) {
    errors.push(`${name} deve ter pelo menos 1 idioma preenchido.`);
  }
}

function validateDate(name: string, value: any, errors: string[]) {
  if (!isDefined(value)) {
    errors.push(`${name} é obrigatório.`);
    return;
  }

  if (!isValidDateValue(value)) {
    errors.push(`${name} é inválida.`);
  }
}

function validatePositiveNumber(name: string, n: any, errors: string[]) {
  if (!isDefined(n)) {
    errors.push(`${name} é obrigatório.`);
    return;
  }
  if (typeof n !== "number" || n < 0) {
    errors.push(`${name} deve ser um número >= 0.`);
  }
}

export function validateEvent(event: Event): string[] {
  const errors: string[] = [];

  // --- I18n ---
  validateI18nValue("title", event.title, errors);
  validateI18nValue("slug", event.slug, errors);
  validateI18nValue("body", event.body, errors);

  if (!(event as any).categoryId) errors.push("categoryId é obrigatório.");
  if (!(event as any).companyId) errors.push("companyId é obrigatório.");

  // --- Imagens ---
  if (!event.heroImage) errors.push("heroImage é obrigatório.");
  if (!event.thumbnail) errors.push("thumbnail é obrigatório.");

  // --- Datas base ---
  validateDate("startDate", event.startDate, errors);
  validateDate("endDate", event.endDate, errors);

  if (isDefined(event.startDate) && isDefined(event.endDate)) {
    const start = parseDate(event.startDate);
    const end = parseDate(event.endDate);

    if (isValidDateValue(start) && isValidDateValue(end) && end.getTime() < start.getTime()) {
      errors.push("endDate deve ser maior ou igual a startDate.");
    }
  }

  // --- Pricing ---
  validatePositiveNumber("pricing", event.pricing, errors);

  // --- URL externa ---
  if (event.externalTicketLink) {
    try {
      new URL(event.externalTicketLink);
    } catch {
      errors.push("externalTicketLink deve ser uma URL válida.");
    }
  }

  // --- Facilities ---
  if ((event as any).facilities && !Array.isArray((event as any).facilities)) {
    errors.push("facilities deve ser uma array.");
  }

  // --- Sponsored Periods ---
  if ((event as any).sponsoredPeriods) {
    for (const sp of (event as any).sponsoredPeriods) {
      validateDate("sponsoredPeriod.startDate", sp.startDate, errors);
      validateDate("sponsoredPeriod.endDate", sp.endDate, errors);
    }
  }

  // --- Occurrences ---
  if ((event as any).occurrences) {
    for (const oc of (event as any).occurrences) {
      validateDate("occurrenceDate", oc.occurrenceDate, errors);
    }
  }

  // --- Recurrence ---
  if (event.recurrence) {
    const r = event.recurrence;

    if (!r.rrule || typeof r.rrule !== "string") {
      errors.push("recurrence.rrule é obrigatório e deve ser string.");
    }

    validateDate("recurrence.until", r.until, errors);

    if (r.exdates && !Array.isArray(r.exdates)) {
      errors.push("recurrence.exdates deve ser um array de datas.");
    }
    if (r.rdates && !Array.isArray(r.rdates)) {
      errors.push("recurrence.rdates deve ser um array de datas.");
    }
  }

  return errors;
}
