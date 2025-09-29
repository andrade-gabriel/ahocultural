import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { tryParseJson } from '@utils/request/parser';
import { DefaultResponse } from "@utils/response/types"
import { CategoryEntity, CategoryIndex, CategoryListRequest, CategoryRequest, CategoryToggleRequest } from '@category/types';
import { validateCategory } from '@category/validator';
import { toCategoryEntity, toCategoryListRequest, toCategoryRequest } from '@category/mapper';
import { getCategoryAsync, upsertCategoryAsync } from '@category/store';
import { notifyAsync } from '@category/notifier';
import { getAsync } from '@category/indexer';

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<DefaultResponse>;
const handlerFactory = new Map<string, HandlerFn>([
    ["/v1/admin/category", listIdHandler],
    ["/v1/admin/category/{id}", getByIdHandler]
]);

// Only determines which get will be triggered
export async function getHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const resource = event.resource.toLowerCase();
    const handler = handlerFactory.get(resource);
    if (handler)
        return await handler(event);
    return {
        success: false,
        errors: ["Invalid Operation"]
    };
}

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

export async function listIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const qs = event.queryStringParameters || {};

    const skip = qs.skip ? parseInt(qs.skip, 10) : 0;
    const take = qs.take ? parseInt(qs.take, 10) : 10;
    const name = qs.name ? qs.name : null;

    const indexedCompanies: CategoryIndex[] = await getAsync(config, skip, take, name);
    const companies: CategoryListRequest[] = indexedCompanies.map(indexedCategory => toCategoryListRequest(indexedCategory));
    return {
        success: true,
        data: companies
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req: CategoryRequest = tryParseJson<CategoryRequest>(event.body, {
        id: "",
        name: "",
        description: "",
        active: true
    });
    let errors: string[] = validateCategory(req);
    if (errors.length == 0) {
        const existingCategoryEntity: CategoryEntity | undefined = await getCategoryAsync(req.id, config.s3.bucket);
        const categoryEntity = await toCategoryEntity(req, existingCategoryEntity);
        if (!await upsertCategoryAsync(categoryEntity, config.s3.bucket))
            errors = ["Failed to Upsert Category - Please, contact suport."];
        else {
            if (await notifyAsync(config.sns.categoryTopic, {
                id: req.id
            }))
                return {
                    success: true,
                    data: true
                }
        }
    }
    return {
        success: false,
        errors: errors
    };
}

export async function patchHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const id: string | undefined = event.pathParameters?.id;
    const req: CategoryToggleRequest = tryParseJson<CategoryToggleRequest>(event.body, {
        active: false
    });
    let errors: string[] = [];
    if (!id)
        errors.push('Campo `id` deve ser preenchido.');

    if (req.active != null && id && errors.length == 0) {
        const existingCategoryEntity: CategoryEntity | undefined = await getCategoryAsync(id, config.s3.bucket);
        if (existingCategoryEntity) {
            existingCategoryEntity.active = req.active;
            if (!await upsertCategoryAsync(existingCategoryEntity, config.s3.bucket))
                errors = ["Failed to Upsert Category `" + id + "`- Please, contact suport."];
            else {
                if (await notifyAsync(config.sns.categoryTopic, {
                    id
                }))
                    return {
                        success: true,
                        data: true
                    }
            }
        } else
            errors: ["Empresa `" + id + "` não existe para ser alterada"]
    }
    return {
        success: false,
        errors: errors
    };
}