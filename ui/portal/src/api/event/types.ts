export type ListEventsParams = {
  fromDate?: string | null;
  categoryId?: string | null;
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Event = {
  id: string;
  title: string;
  slug: string;
  category: string;
  categoryName: string;
  categorySlug: string;
  location: string;
  company: string;
  heroImage: string;
  thumbnail: string;
  body: string;
  startDate: Date;
  endDate: Date;
  pricing: number;
  externalTicketLink: string;
  facilities: string[];
  sponsored: boolean;
  active: boolean;
};

export interface EventDetail {
  id: string;
  title: string;
  slug: string;

  categories: {
    id: string;
    name: string;
    slug: string;
  }[];

  company: {
    id: string;
    name: string;
    slug: string;
    address: {
      street: string;
      number: string;
      complement?: string;
      district: string;
      city: string;
      state: string;
      state_full: string;
      postal_code: string;
      country: string;
      country_code: string;
    };
  };

  location: {
    id: string;
    name: string;
    slug: string;
    district: string | null;
    districtSlug: string | null;
  };

  heroImage: string;
  thumbnail: string;

  startDate: string; // manter string, pois virá do JSON (ISO 8601)
  endDate: string;

  facilities: string[];
  pricing: number;
  externalTicketLink: string;
  sponsored: boolean;
  active: boolean;

  created_at: string;
  updated_at: string;

  // Opcional: corpo HTML (pode vir vazio)
  body?: string;
}