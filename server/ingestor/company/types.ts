export interface CompanyPayload {
    id: string;
}

export interface CompanyEntity {
    id: string;
    name: string;
    address: {
        street: string;         // "Av. Paulista"
        number?: string;        // "1578"
        complement?: string;    // "Conj. 1203"
        district?: string;      // "Bela Vista"
        city: string;           // "São Paulo"
        state: string;          // "SP"
        state_full?: string;    // "São Paulo"
        postal_code?: string;   // "01310-200"
        country: string;        // "Brasil"
        country_code: string;   // "BR"
    };
    geo: {
        lat: number | null;     // WGS84
        lng: number | null;     // WGS84
    };
    formatted_address?: string;
    created_at: Date;
    updated_at: Date;
    active: boolean;
}

export interface CompanyIndex {
  id: string;              // keyword
  name: string;            // text (full-text search) + keyword (para filtros/sort exato)
  street: string;          // text + keyword
  number?: string;         // keyword (exato)
  complement?: string;     // text + keyword
  district?: string;       // text + keyword
  city: string;            // text + keyword
  state: string;           // keyword (exato)
  state_full?: string;     // text + keyword
  postal_code?: string;    // keyword (exato)
  country: string;         // text + keyword
  country_code: string;    // keyword (exato)
  geo: {
    lat: number;           // parte do geo_point
    lon: number;           // parte do geo_point (⚠️ ES espera "lon", não "lng")
  };
  active: boolean;         // boolean
}
