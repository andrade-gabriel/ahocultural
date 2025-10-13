export type ListCategoriesParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Category = {
  id: string;
  parent_id: string;
  parent_name: string;
  parent_slug: string;
  name: string;
  slug: string;
  active: boolean;
};