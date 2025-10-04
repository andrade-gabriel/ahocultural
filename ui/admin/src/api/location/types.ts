export type ListLocationsParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Location = {
  id: string;
  country: string;
  countrySlug: string;
  state: string;
  stateSlug: string;
  city: string;
  citySlug: string;
  active: boolean;
};

export type LocationDetail = {
  id: string;
  country: string;
  countrySlug: string;
  state: string;
  stateSlug: string;
  city: string;
  citySlug: string;
  districtsAndSlugs: Record<string, string>;
  description: string;
  active: boolean;
};