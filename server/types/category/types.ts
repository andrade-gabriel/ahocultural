export interface CategoryEntity {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CategoryRequest {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
}

export interface CategoryIndex {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface CategoryListRequest {
    id: string;
    name: string;
    active: boolean;
}

export interface CategoryToggleRequest {
    active: boolean;
}

export interface CategoryPayload {
    id: string;
}