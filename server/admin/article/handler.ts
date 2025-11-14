import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { Article, ArticleListItem } from '@article/types';
import { validateArticle } from '@article/validator';
import { getArticleAsync, insertArticleAsync, listArticlesAsync, updateArticleActiveAsync, updateArticleAsync } from '@article/store';

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<DefaultResponse>;
const handlerFactory = new Map<string, HandlerFn>([
    ["/v1/admin/article", listIdHandler],
    ["/v1/admin/article/{id}", getByIdHandler]
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
        const article: Article | undefined = await getArticleAsync(config, id);
        if (article) {
            return {
                success: true,
                data: article
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

    const articles: ArticleListItem[] = await listArticlesAsync(config, skip, take, name);
    return {
        success: true,
        data: articles
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        title: {
            pt: '',
            en: '',
            es: ''
        },
        slug: {
            pt: '',
            en: '',
            es: ''
        },
        heroImage: '',
        thumbnail: '',
        publicationDate: null,
        active: false,
        body: {
            pt: '',
            en: '',
            es: ''
        },
    };
    let errors: string[] = validateArticle(req);
    if (errors.length == 0) {
        if (await insertArticleAsync(config, req))
            return {
                success: true,
                data: true
            }
        else
            errors = ["Failed to Insert Article - Please, contact suport!"];
    }
    return {
        success: false,
        errors: errors
    };
}

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req: Article = event.body ? JSON.parse(event.body) : {
        id: 0,
        title: {
            pt: '',
            en: '',
            es: ''
        },
        slug: {
            pt: '',
            en: '',
            es: ''
        },
        heroImage: '',
        thumbnail: '',
        publicationDate: null,
        active: false,
        body: {
            pt: '',
            en: '',
            es: ''
        },
    };
    let errors: string[] = validateArticle(req);
    if (req && errors.length == 0) {
        if (await updateArticleAsync(config, req))
            return {
                success: true,
                data: true
            }
        else {
            errors = ["Failed to Update Article - Please, contact suport!"];
        }
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
            data: await updateArticleActiveAsync(config, id, req.active)
        }
    }
    return {
        success: false,
        errors: errors
    };
}