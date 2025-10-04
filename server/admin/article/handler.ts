import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { tryParseJson } from '@utils/request/parser';
import { DefaultResponse } from "@utils/response/types"
import { ArticleEntity, ArticleIndex, ArticleListRequest, ArticleToggleRequest } from '@article/types';
import { validateArticle } from '@article/validator';
import { toArticleEntity, toArticleListRequest, toArticleRequest } from '@article/mapper';
import { getArticleAsync, upsertArticleAsync } from '@article/store';
import { notifyAsync } from '@article/notifier';
import { getAsync } from '@article/indexer';
import { randomUUID } from 'node:crypto';

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
    const id: string | undefined = event.pathParameters?.id;
    if (id) {
        const articleEntity: ArticleEntity | undefined = await getArticleAsync(id, config.s3.bucket);
        if (articleEntity) {
            return {
                success: true,
                data: toArticleRequest(articleEntity)
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

    const indexedCompanies: ArticleIndex[] = await getAsync(config, skip, take, name);
    const companies: ArticleListRequest[] = indexedCompanies.map(indexedArticle => toArticleListRequest(indexedArticle));
    return {
        success: true,
        data: companies
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        id: '',
        title: '',
        imageUrl: '',
        body: '',
        publicationDate: new Date(),
        active: false
    };
    let errors: string[] = validateArticle(req);
    if (errors.length == 0) {
        req.id = randomUUID();
        const articleEntity = await toArticleEntity(req, undefined);
        if (!await upsertArticleAsync(articleEntity, config.s3.bucket))
            errors = ["Failed to Insert Article - Please, contact suport."];
        else {
            if (await notifyAsync(config.sns.articleTopic, {
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

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        id: '',
        title: '',
        imageUrl: '',
        body: '',
        publicationDate: new Date(),
        active: false
    };
    // Force Id in put handler
    req.id = event.pathParameters?.id ?? '';
    let errors: string[] = validateArticle(req);
    if (req && req.id && errors.length == 0) {
        const existingArticleEntity: ArticleEntity | undefined = await getArticleAsync(req.id, config.s3.bucket);
        if(existingArticleEntity){
            const articleEntity = await toArticleEntity(req, existingArticleEntity);
            if (!await upsertArticleAsync(articleEntity, config.s3.bucket))
                errors = ["Failed to Update Article - Please, contact suport."];
            else {
                if (await notifyAsync(config.sns.articleTopic, {
                    id: req.id
                }))
                    return {
                        success: true,
                        data: true
                    }
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
    const req: ArticleToggleRequest = tryParseJson<ArticleToggleRequest>(event.body, {
        active: false
    });
    let errors: string[] = [];
    if (!id)
        errors.push('Campo `id` deve ser preenchido.');

    if (req.active != null && id && errors.length == 0) {
        const existingArticleEntity: ArticleEntity | undefined = await getArticleAsync(id, config.s3.bucket);
        if (existingArticleEntity) {
            existingArticleEntity.active = req.active;
            if (!await upsertArticleAsync(existingArticleEntity, config.s3.bucket))
                errors = ["Failed to Upsert Article `" + id + "`- Please, contact suport."];
            else {
                if (await notifyAsync(config.sns.articleTopic, {
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