export type ListLocationsParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export interface Location {
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
}