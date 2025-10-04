export type ListCompaniesParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Company = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

export type CompanyDetail = {
  name: string;
  slug: string;
  active: boolean;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    state_full?: string;
    postal_code?: string;
    country?: string;
    country_code?: string;
  };
  geo?: {
    lat?: number;
    lng?: number;
  };
};