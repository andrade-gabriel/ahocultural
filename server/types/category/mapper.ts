import { CategoryRequest, CategoryEntity, CategoryIndex, CategoryListRequest } from "./types";

export function toCategoryEntity(
    input: CategoryRequest,
    existingCategoryEntity: CategoryEntity | undefined
): CategoryEntity {
    const now = new Date();
    return {
        id: input?.id.trim(),
        parent_id: input?.parent_id,
        name: input?.name.trim(),
        description: input?.description,
        created_at: existingCategoryEntity ? existingCategoryEntity.created_at : now,
        updated_at: now,
        active: input?.active
    };
}

export function toCategoryRequest(
    input: CategoryEntity
): CategoryRequest {
    return {
        id: input.id,
        parent_id: input.parent_id,
        name: input.name,
        description: input.description,
        active: input.active
    };
}

export function toCategoryListRequest(
    input: CategoryIndex
) : CategoryListRequest {
    return {
        id: input.id,
        parent_id: input.parent_id,
        name: input.name,
        active: input.active
    }
}

export function toCategoryIndex(
  input: CategoryEntity
): CategoryIndex {
  return {
    id: input.id.trim(),
    parent_id: input.parent_id,
    name: input.name.trim(),
    description: input.description,
    active: input.active
  };
}
