export type ListCategorysParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
};

export type CategoryDetail = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
};