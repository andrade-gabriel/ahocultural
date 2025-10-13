import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { CategoryEntity, CategoryIndex, CategoryListRequest } from '@category/types';
import { toCategoryListRequest, toCategoryRequest } from '@category/mapper';
import { getAsync, getChildrenAsync } from '@category/indexer';
import { getCategoryAsync } from '@category/store';

export async function getByIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const id: string | undefined = event.pathParameters?.id;
    if (id) {
        const categoryEntity: CategoryEntity | undefined = await getCategoryAsync(id, config.s3.bucket);
        if (categoryEntity) {
            return {
                success: true,
                data: toCategoryRequest(categoryEntity)
            };
        }
        return {
            success: true,
            data: null
        };
    }

    return {
        success: false,
        errors: ["O campo `id` deve ser preenchido"]
    };
}

export async function listChildrenHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const parentId: string | undefined = event.pathParameters?.id;
    if (parentId) {
        const qs = event.queryStringParameters || {};

        const skip = qs.skip ? parseInt(qs.skip, 10) : 0;
        const take = qs.take ? parseInt(qs.take, 10) : 10;

        const indexedCategories: CategoryIndex[] = await getChildrenAsync(config, parentId, skip, take);
        const categories: CategoryListRequest[] = indexedCategories.map(indexedEvent => toCategoryListRequest(indexedEvent));
        return {
            success: true,
            data: categories
        };
    }
    return {
        success: false,
        errors: ["O campo `id` deve ser preenchido"]
    }
}

export async function listIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const qs = event.queryStringParameters || {};

    const skip = qs.skip ? parseInt(qs.skip, 10) : 0;
    const take = qs.take ? parseInt(qs.take, 10) : 10;
    const name = qs.name ? qs.name : null;

    const indexedCategories: CategoryIndex[] = await getAsync(config, skip, take, true, name);
    const categories: CategoryListRequest[] = indexedCategories.map(indexedEvent => toCategoryListRequest(indexedEvent));
    return {
        success: true,
        data: categories
    };
}