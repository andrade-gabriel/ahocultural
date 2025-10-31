import { I18nNullableValue, I18nValue } from "types/language/types";

export interface CategoryEntity {
    id: string;
    name: I18nValue;
    slug: I18nValue;
    description: I18nNullableValue;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CategoryRequest {
    id: string;
    name: I18nValue;
    slug: I18nValue;
    description: I18nNullableValue;
    active: boolean;
}

export interface CategoryIndex {
    id: string;
    name: I18nValue;
    slug: I18nValue;
    description: I18nNullableValue;
    active: boolean;
}

export interface CategoryListRequest {
    id: string;
    name: I18nValue;
    slug: I18nValue;
    active: boolean;
}

export interface CategoryToggleRequest {
    active: boolean;
}

export interface CategoryPayload {
    id: string;
}