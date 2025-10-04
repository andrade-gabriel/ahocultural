import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { tryParseJson } from '@utils/request/parser';
import { DefaultResponse } from "@utils/response/types"
import { LocationEntity, LocationIndex, LocationListRequest, LocationToggleRequest } from '@location/types';
import { validateLocation } from '@location/validator';
import { toLocationEntity, toLocationListRequest, toLocationRequest } from '@location/mapper';
import { getLocationAsync, upsertLocationAsync } from '@location/store';
import { notifyAsync } from '@location/notifier';
import { getAsync } from '@location/indexer';
import { randomUUID } from 'node:crypto';

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<DefaultResponse>;
const handlerFactory = new Map<string, HandlerFn>([
    ["/v1/admin/location", listIdHandler],
    ["/v1/admin/location/{id}", getByIdHandler]
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
        const locationEntity: LocationEntity | undefined = await getLocationAsync(id, config.s3.bucket);
        if (locationEntity) {
            return {
                success: true,
                data: toLocationRequest(locationEntity)
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

    const indexedCompanies: LocationIndex[] = await getAsync(config, skip, take, name);
    const companies: LocationListRequest[] = indexedCompanies.map(indexedLocation => toLocationListRequest(indexedLocation));
    return {
        success: true,
        data: companies
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        id: '',
        country: '',
        countrySlug: '',
        state: '',
        stateSlug: '',
        city: '',
        citySlug: '',
        districtsAndSlugs: {},
        active: false
    };
    let errors: string[] = validateLocation(req);
    if (errors.length == 0) {
        req.id = randomUUID();
        // TODO: Validate if already exists one location w/ same Country + State + City
        const locationEntity = await toLocationEntity(req, undefined);
        if (!await upsertLocationAsync(locationEntity, config.s3.bucket))
            errors = ["Failed to Insert Location - Please, contact suport."];
        else {
            if (await notifyAsync(config.sns.locationTopic, {
                id: req.id
            }))
                return {
                    success: true,
                    data: req.id
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
        country: '',
        countrySlug: '',
        state: '',
        stateSlug: '',
        city: '',
        citySlug: '',
        districtsAndSlugs: {},
        active: false
    };
    // Force Id in put handler
    req.id = event.pathParameters?.id ?? '';
    let errors: string[] = validateLocation(req);
    if (req && req.id && errors.length == 0) {
        const existingLocationEntity: LocationEntity | undefined = await getLocationAsync(req?.id, config.s3.bucket);
        if (existingLocationEntity) {
            const locationEntity = await toLocationEntity(req, existingLocationEntity);
            if (!await upsertLocationAsync(locationEntity, config.s3.bucket))
                errors = ["Failed to Update Location - Please, contact suport."];
            else {
                if (await notifyAsync(config.sns.locationTopic, {
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
    const req: LocationToggleRequest = tryParseJson<LocationToggleRequest>(event.body, {
        active: false
    });
    let errors: string[] = [];
    if (!id)
        errors.push('Campo `id` deve ser preenchido.');

    if (req.active != null && id && errors.length == 0) {
        const existingLocationEntity: LocationEntity | undefined = await getLocationAsync(id, config.s3.bucket);
        if (existingLocationEntity) {
            existingLocationEntity.active = req.active;
            if (!await upsertLocationAsync(existingLocationEntity, config.s3.bucket))
                errors = ["Failed to Upsert Location `" + id + "`- Please, contact suport."];
            else {
                if (await notifyAsync(config.sns.locationTopic, {
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