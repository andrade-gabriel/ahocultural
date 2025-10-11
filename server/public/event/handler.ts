import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { EventEntity, EventIndex, EventListRequest } from '@event/types';
import { toEventListRequest, toEventRequest } from '@event/mapper';
import { getEventAsync } from '@event/store';
import { getAsync, getBySlugAsync } from '@event/indexer';

export async function getByIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const slug: string | undefined = event.pathParameters?.id;
    if (slug) {
        const eventIndex: EventIndex | null = await getBySlugAsync(config, slug);
        if (eventIndex) {
            const eventEntity: EventEntity | undefined = await getEventAsync(eventIndex.id, config.s3.bucket);
            if (eventEntity) {
                return {
                    success: true,
                    data: toEventRequest(eventEntity)
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

    const indexedEvents: EventIndex[] = await getAsync(config, skip, take, name);
    const events: EventListRequest[] = indexedEvents.map(indexedEvent => toEventListRequest(indexedEvent));
    return {
        success: true,
        data: events
    };
}