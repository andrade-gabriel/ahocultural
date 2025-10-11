import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { ArticleEntity, ArticleIndex, ArticleListRequest } from '@article/types';
import { toArticleListRequest, toArticleRequest } from '@article/mapper';
import { getArticleAsync } from '@article/store';
import { getAsync, getBySlugAsync, getRelatedByDateFromIdAsync } from '@article/indexer';

export async function getByIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const slug: string | undefined = event.pathParameters?.id;
    if (slug) {
        const articleIndex: ArticleIndex | null = await getBySlugAsync(config, slug);
        if (articleIndex) {
            const articleEntity: ArticleEntity | undefined = await getArticleAsync(articleIndex.id, config.s3.bucket);
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

    const indexedArticles: ArticleIndex[] = await getAsync(config, skip, take, name);
    const articles: ArticleListRequest[] = indexedArticles.map(indexedArticle => toArticleListRequest(indexedArticle));
    return {
        success: true,
        data: articles
    };
}

export async function getRelatedByDateFromIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const id: string | undefined = event.pathParameters?.id;
    if (id) {
        const indexedArticles: ArticleIndex[] = await getRelatedByDateFromIdAsync(config, id);
        const articles: ArticleListRequest[] = indexedArticles.map(indexedArticle => toArticleListRequest(indexedArticle));
        return {
            success: true,
            data: articles
        };
    }
    return {
        success: false,
        errors: ["O campo `id` deve ser preenchido"]
    };
}