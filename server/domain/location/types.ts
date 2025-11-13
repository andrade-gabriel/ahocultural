// === DB rows (nomes e tipos fiéis ao banco) ===

export interface LocationRow {
  id: number;
  city_id: number;          // FK -> city.id
  state_id?: number;          // FK -> state.id
  country_id?: number;          // FK -> country.id
  description: string;
  active: number;           // TINYINT(1): 0 | 1
  created_at: Date;
  updated_at: Date;
}

export interface LocationDistrictRow {
  id: number;
  location_id: number;      // FK -> location.id
  district: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface Location {
  id: number;
  cityId: number;
  stateId?: number;
  countryId?: number;
  description: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  districts?: LocationDistrict[];
}

export interface LocationDistrict {
  id?: number;
  district: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface LocationListItem {
  id: number;
  country: string;
  state: string;
  city: string;
  active: boolean;
}

export function mapLocationRowToLocation(row: LocationRow): Location {
  return {
    id: row.id,
    cityId: row.city_id,
    description: row.description,
    active: row.active === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

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
