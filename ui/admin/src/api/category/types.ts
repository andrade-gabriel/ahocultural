export type ListCategorysParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
  parent?: boolean;
};

export type Category = {
  id: string;
  parent_id: string | null;
  parent_name: string | null;
  parent_slug: string | null;
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