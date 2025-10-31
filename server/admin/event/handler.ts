import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { tryParseJson } from '@utils/request/parser';
import { DefaultResponse } from "@utils/response/types"
import { EventEntity, EventIndex, EventListRequest, EventToggleRequest } from '@event/types';
import { validateEvent } from '@event/validator';
import { toEventEntity, toEventListRequest, toEventRequest } from '@event/mapper';
import { getEventAsync, upsertEventAsync } from '@event/store';
import { notifyAsync } from '@event/notifier';
import { getAsync } from '@event/indexer';
import { randomUUID } from 'node:crypto';
import { renameAndFinalizeAsset } from 'types/file/store';
import { SeoImageType } from 'types/file/types';

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<DefaultResponse>;
const handlerFactory = new Map<string, HandlerFn>([
    ["/v1/admin/event", listIdHandler],
    ["/v1/admin/event/{id}", getByIdHandler]
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
        const eventEntity: EventEntity | undefined = await getEventAsync(id, config.s3.bucket);
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

    return {
        success: false,
        errors: ["O campo `id` deve ser preenchido."]
    };
}

export async function listIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const qs = event.queryStringParameters || {};

    const skip = qs.skip ? parseInt(qs.skip, 10) : 0;
    const take = qs.take ? parseInt(qs.take, 10) : 10;
    const name = qs.name ? qs.name : null;

    const indexedCompanies: EventIndex[] = await getAsync(config, skip, take, name);
    const companies: EventListRequest[] = indexedCompanies.map(indexedEvent => toEventListRequest(indexedEvent));
    return {
        success: true,
        data: companies
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        id: '',
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
        imageUrl: '',
        body: {
            pt: '',
            en: '',
            es: ''
        },
        publicationDate: new Date(),
        active: false
    };
    let errors: string[] = validateEvent(req);
    if (errors.length == 0) {
        req.id = randomUUID();

        req.heroImage = await renameAndFinalizeAsset({
                    bucket: config.s3.assetsBucket
                    , assetType: SeoImageType.Hero
                    , id: req.heroImage
                    , slug: req.slug })
        
        req.thumbnail = await renameAndFinalizeAsset({
            bucket: config.s3.assetsBucket
            , assetType: SeoImageType.Thumbnail
            , id: req.thumbnail
            , slug: req.slug })

        const eventEntity = await toEventEntity(req, undefined);
        if (!await upsertEventAsync(eventEntity, config.s3.bucket))
            errors = ["Failed to Upsert Event - Please, contact suport."];
        else {
            if (await notifyAsync(config.sns.eventTopic, {
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
        imageUrl: '',
        body: {
            pt: '',
            en: '',
            es: ''
        },
        publicationDate: new Date(),
        active: false
    };
    // Force Id in put handler
    req.id = event.pathParameters?.id ?? '';
    let errors: string[] = validateEvent(req);
    if (req && req.id && errors.length == 0) {

        req.heroImage = await renameAndFinalizeAsset({
                    bucket: config.s3.assetsBucket
                    , assetType: SeoImageType.Hero
                    , id: req.heroImage
                    , slug: req.slug.pt })
        
        req.thumbnail = await renameAndFinalizeAsset({
            bucket: config.s3.assetsBucket
            , assetType: SeoImageType.Thumbnail
            , id: req.thumbnail
            , slug: req.slug.pt })

        const existingEventEntity: EventEntity | undefined = await getEventAsync(req?.id, config.s3.bucket);
        if(existingEventEntity){
            const eventEntity = await toEventEntity(req, existingEventEntity);
            if (!await upsertEventAsync(eventEntity, config.s3.bucket))
                errors = ["Failed to Upsert Event - Please, contact suport!"];
            else {
                if (await notifyAsync(config.sns.eventTopic, {
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
    const req: EventToggleRequest = tryParseJson<EventToggleRequest>(event.body, {
        active: false
    });
    let errors: string[] = [];
    if (!id)
        errors.push('Campo `id` deve ser preenchido.');

    if (req.active != null && id && errors.length == 0) {
        const existingEventEntity: EventEntity | undefined = await getEventAsync(id, config.s3.bucket);
        if (existingEventEntity) {
            existingEventEntity.active = req.active;
            if (!await upsertEventAsync(existingEventEntity, config.s3.bucket))
                errors = ["Failed to Upsert Event `" + id + "`- Please, contact suport."];
            else {
                if (await notifyAsync(config.sns.eventTopic, {
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