import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { Category, CategoryListItem } from '@category/types';
import { validateCategory } from '@category/validator';
import { toCategory } from '@category/mapper';
import { getCategoryAsync, insertCategoryAsync, listCategoriesAsync, updateCategoryActiveAsync, updateCategoryAsync } from '@category/store';

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
    const idParam = event.pathParameters?.id;
    const id: number | undefined = idParam ? parseInt(idParam, 10) : undefined;
    if (id) {
        const category: Category | undefined = await getCategoryAsync(config, id);
        if (category) {
            return {
                success: true,
                data: category
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

    const categories: CategoryListItem[] = await listCategoriesAsync(config, skip, take, name);
    return {
        success: true,
        data: categories
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        id: "",
        parent_id: null,
        name: { pt: "", en: "", es: "" },
        slug: { pt: "", en: "", es: "" },
        description: { pt: "", en: "", es: "" },
        active: true
    };
    let errors: string[] = validateCategory(req);
    if (errors.length == 0) {
        const category = await toCategory(req, undefined);
        const id = await insertCategoryAsync(config, category);
        if (id)
            return {
                success: true,
                data: id
            }
        else
            errors = ["Failed to Insert Category - Please, contact suport."];
    }
    return {
        success: false,
        errors: errors
    };
}

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        id: "",
        parent_id: null,
        name: { pt: "", en: "", es: "" },
        slug: { pt: "", en: "", es: "" },
        description: { pt: "", en: "", es: "" },
        active: true
    };
    // Force Id in put handler
    req.id = event.pathParameters?.id ?? '';
    let errors: string[] = validateCategory(req);
    if (req && req.id && errors.length == 0) {
        const existingCategory: Category | undefined = await getCategoryAsync(config, req.id);
        if (existingCategory) {
            const category = await toCategory(req, existingCategory);
            return {
                success: true,
                data: await updateCategoryAsync(config, category)
            }
        }
        else
            errors = ["Cannot Update a Company that does not exists."];
    }
    return {
        success: false,
        errors: errors
    };
}

export async function patchHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const idParam = event.pathParameters?.id;
    const id: number | undefined = idParam ? parseInt(idParam, 10) : undefined;
    const req = event.body ? JSON.parse(event.body) : {
        active: false
    };
    let errors: string[] = [];
    if (!id)
        errors.push('Campo `id` deve ser preenchido.');

    if (req.active != null && id && errors.length == 0) {
        return {
            success: true,
            data: await updateCategoryActiveAsync(config, id, req.active)
        }
    }
    return {
        success: false,
        errors: errors
    };
}