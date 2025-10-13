import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { EventEntity, EventIndex } from '@event/types';
import { toEventPublicIndex } from '@event/mapper';
import { getEventAsync } from '@event/store';
import { getAsync, getBySlugAsync, getRelatedEventsBySlugCatLocDateAsync } from '@event/indexer';
import { CompanyEntity } from '@company/types';
import { getCompanyAsync } from '@company/store';
import { LocationEntity } from '@location/types';
import { getLocationAsync } from '@location/store';
import { CategoryIndex } from '@category/types';
import { getCategoryByIdAsync } from '@category/indexer';

export async function getByIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const slug: string | undefined = event.pathParameters?.id;
    if (slug) {
        const eventIndex: EventIndex | null = await getBySlugAsync(config, slug);
        if (eventIndex) {
            const eventEntity: EventEntity | undefined = await getEventAsync(eventIndex.id, config.s3.bucket);
            if (eventEntity) {
                const companyEntity: CompanyEntity | undefined = await getCompanyAsync(eventEntity.company, config.s3.bucket);
                console.log('companyEntity', companyEntity)
                if (companyEntity) {
                    console.log('eventEntity.category', eventEntity.category);
                    const [locationEntity, categories]: [
                        LocationEntity | undefined,
                        CategoryIndex | null
                    ] = await Promise.all([
                        getLocationAsync(companyEntity.location, config.s3.bucket),
                        getCategoryByIdAsync(config, eventEntity.category),
                    ]);
                    console.log('locationEntity', locationEntity)
                    console.log('categories', categories)
                    if (locationEntity && categories) {
                        return {
                            success: true,
                            data: toEventPublicIndex(eventEntity,
                                categories,
                                companyEntity,
                                locationEntity
                            )
                        };
                    }
                }
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

    const fromDate = qs.fromDate ? qs.fromDate : null;
    const categoryId = qs.categoryId ? qs.categoryId : null;
    const skip = qs.skip ? parseInt(qs.skip, 10) : 0;
    const take = qs.take ? parseInt(qs.take, 10) : 10;
    const name = qs.name ? qs.name : null;

    const indexedEvents: EventIndex[] = await getAsync(config, skip, take, name, fromDate, categoryId);
    // const events: EventListRequest[] = indexedEvents.map(indexedEvent => toEventListRequest(indexedEvent));
    return {
        success: true,
        data: indexedEvents
    };
}

export async function getRelatedByDateFromIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const id: string | undefined = event.pathParameters?.id;
    if (id) {
        const indexedEvents: EventIndex[] = await getRelatedEventsBySlugCatLocDateAsync(config, id);
        return {
            success: true,
            data: indexedEvents
        };
    }
    return {
        success: false,
        errors: ["O campo `id` deve ser preenchido."]
    };
}