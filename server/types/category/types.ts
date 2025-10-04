export interface CategoryEntity {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CategoryRequest {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    active: boolean;
}

export interface CategoryIndex {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
}

export interface CategoryListRequest {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    active: boolean;
}

export interface CategoryToggleRequest {
    active: boolean;
}

export interface CategoryPayload {
    id: string;
}