export type ListCompaniesParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Company = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
};

export type CompanyDetail = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  address?: {
    locationId: number;
    locationDistrictId: number;
    street: string;
    number: string;
    complement?: string;
    district: string;
    postal_code: string;
  };
  geo: {
    lat: number;
    lng: number;
  };
};