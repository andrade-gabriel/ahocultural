export interface CountryRow {
  id: number;
  name: string;
  iso2: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface Country {
  id: number;
  name: string;
  iso2: string;          // Ex.: "BR"
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StateRow {
  id: number;
  country_id: number;
  name: string;
  uf: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface State {
  id: number;
  country_id: number;
  name: string;          // Ex.: "São Paulo"
  uf: string;            // Ex.: "SP"
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CityRow {
  id: number;
  state_id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface City {
  id: number;
  state_id: number;
  name: string;          // Ex.: "Santos"
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}
