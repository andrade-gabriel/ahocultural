import { Location, LocationDistrict, LocationDistrictRow, LocationRow } from "./types";

/** Row -> Domain */
export function mapLocationRowToLocation(row: LocationRow): Location {
  return {
    id: row.id,
    cityId: row.city_id,
    stateId: row.state_id,
    countryId: row.country_id,
    description: row.description,
    active: row.active === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Domain -> Row (útil para INSERT/UPDATE com driver que não converte boolean) */
export function mapLocationToRow(model: Location): LocationRow {
  return {
    id: model.id,
    city_id: model.cityId,
    description: model.description,
    active: model.active ? 1 : 0,
    created_at: model.created_at,
    updated_at: model.updated_at,
  };
}

/** Input (API/UI) -> Domain (merge com existente quando fizer update) */
export function toLocation(
  input: any,
  existingLocationEntity: Location | undefined
): Location {
  const now = new Date();

  // id
  const id =
    typeof input.id === "number"
      ? input.id
      : existingLocationEntity?.id ??
        (input.id ? parseInt(String(input.id), 10) : 0);

  // cityId (obrigatório na nova modelagem)
  const cityIdRaw = input.cityId ?? input.city_id;
  const cityId =
    typeof cityIdRaw === "number"
      ? cityIdRaw
      : cityIdRaw
      ? parseInt(String(cityIdRaw), 10)
      : existingLocationEntity?.cityId ?? 0;

  // districts
  let districts: LocationDistrict[] = [];
  if (Array.isArray(input.districts)) {
    districts = input.districts.map((d: any) => toLocationDistrict(d));
  } else if (existingLocationEntity?.districts) {
    districts = existingLocationEntity.districts;
  }

  return {
    id,
    cityId,
    description: String(input.description ?? existingLocationEntity?.description ?? "").trim(),
    created_at: existingLocationEntity?.created_at ?? now,
    updated_at: now,
    active:
      typeof input.active === "boolean"
        ? input.active
        : existingLocationEntity?.active ?? true,
    districts,
  };
}

/** Row -> Domain */
export function mapRowToLocationDistrict(row: LocationDistrictRow): LocationDistrict {
  return {
    id: row.id,
    district: row.district,
    slug: row.slug,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Input (API/UI) -> Domain */
export function toLocationDistrict(input: any): LocationDistrict {
  const now = new Date();

  const id =
    typeof input.id === "number"
      ? input.id
      : input.id
      ? parseInt(String(input.id), 10)
      : undefined;

  return {
    id,
    district: String(input.district ?? "").trim(),
    slug: String(input.slug ?? "").trim(),
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}
