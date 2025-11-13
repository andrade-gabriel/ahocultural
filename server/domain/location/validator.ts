import { Location, LocationDistrict } from "./types";

export function validateLocation(location: Location): string[] {
  const errors: string[] = [];

  // cityId (required, positive integer)
  if (!Number.isInteger(location.cityId) || location.cityId <= 0) {
    errors.push("Field `cityId` must be a positive integer.");
  }

  // description (required, non-empty)
  if (!location.description || String(location.description).trim().length < 1) {
    errors.push("Field `description` is required.");
  }

  // active (boolean) — opcional, só valida tipo se vier algo inesperado
  if (typeof location.active !== "boolean") {
    errors.push("Field `active` must be a boolean.");
  }

  // districts (optional)
  if (Array.isArray(location.districts) && location.districts.length > 0) {
    const districtErrors = validateLocationDistricts(location.districts);
    errors.push(...districtErrors);

    // Uniqueness de slug (case-insensitive) dentro do payload
    const seen = new Set<string>();
    for (const d of location.districts) {
      const slug = String(d.slug ?? "").trim().toLowerCase();
      if (!slug) continue;
      if (seen.has(slug)) {
        errors.push(`Duplicate district slug detected: \`${slug}\`.`);
      }
      seen.add(slug);
    }
  }

  return errors;
}

export function validateLocationDistricts(districts: LocationDistrict[]): string[] {
  const errors: string[] = [];
  for (const district of districts) {
    const name = String(district.district ?? "").trim();
    const slug = String(district.slug ?? "").trim();

    // district (required, >= 2 chars)
    if (name.length < 2) {
      errors.push(
        `District "${name || "(unnamed)"}": field \`district\` must be at least 2 characters.`
      );
    }

    // slug (required, >= 2 chars, allowed chars optional check)
    if (slug.length < 2) {
      errors.push(
        `District "${name || "(unnamed)"}": field \`slug\` must be at least 2 characters.`
      );
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push(
        `District "${name || "(unnamed)"}": field \`slug\` must contain only lowercase letters, digits, and hyphens.`
      );
    }
  }
  return errors;
}
