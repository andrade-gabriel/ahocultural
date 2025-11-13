import { City, CityRow, Country, CountryRow, State, StateRow } from "./types";

export function mapCountryRow(r: CountryRow): Country {
  return {
    id: r.id,
    name: r.name,
    iso2: r.iso2,
    slug: r.slug,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export function mapStateRow(r: StateRow): State {
  return {
    id: r.id,
    country_id: r.country_id,
    name: r.name,
    uf: r.uf,
    slug: r.slug,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export function mapCityRow(r: CityRow): City {
  return {
    id: r.id,
    state_id: r.state_id,
    name: r.name,
    slug: r.slug,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}