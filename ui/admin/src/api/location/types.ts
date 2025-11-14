// packages/app/src/api/location/types.ts

export type ListLocationsParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Location = {
  id: number;
  country: string;
  state: string;
  city: string;
  active: boolean;
};

export type LocationDetail = {
  id: number;
  cityId: number;
  stateId: number;
  countryId: number;
  description: string;
  active: boolean;
  districts: { 
    district: string; 
    slug: string 
  }[];
};
