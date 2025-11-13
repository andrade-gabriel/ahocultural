export type CompanyRow = {
  id: number;
  name: string;
  slug: string;
  address_id: number;
  location_id: number;
  location_district_id: number;
  active: number | boolean;
  created_at: string | Date;
  updated_at: string | Date;

  // address.*
  street: string;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
};

export interface Company {
    id: number;
    name: string;
    slug: string;
    address: {
        locationId: number;
        locationDistrictId: number;
        street: string;         // "Av. Paulista"
        number?: string;        // "1578"
        complement?: string;    // "Conj. 1203"
        district?: string;      // "Bela Vista"
        postal_code?: string;   // "01310-200"
    };
    geo: {
        lat: number;     // WGS84
        lng: number;     // WGS84
    };
    created_at: Date;
    updated_at: Date;
    active: boolean;
}

export interface CompanyListItem {
    id: string;
    name: string;
    slug: string;
    active: boolean;
}