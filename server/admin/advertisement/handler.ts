import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { AdvertisementEntity, AdvertisementRequest } from '@advertisement/types';
import { validateAdvertisement } from '@advertisement/validator';
import { toAdvertisementEntity, toAdvertisementRequest } from '@advertisement/mapper';
import { getAdvertisementAsync, upsertAdvertisementAsync } from '@advertisement/store';

export async function getHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const entity: AdvertisementEntity | undefined = await getAdvertisementAsync(config.s3.bucket);
    if (entity) {
        return {
            success: true,
            data: toAdvertisementRequest(entity)
        };
    }
    return {
        success: true,
        data: null
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        body: {
            pt: '',
            en: '',
            es: ''
        },
    };
    let errors: string[] = validateAdvertisement(req);
    if (errors.length == 0) {

        const entity = await toAdvertisementEntity(req);
        if (await upsertAdvertisementAsync(entity, config.s3.bucket))
            return {
                success: true,
                data: true
            }
        else
            errors = ["Failed to Insert Advertisement - Please, contact suport!"];
    }
    return {
        success: false,
        errors: errors
    };
}

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req: AdvertisementRequest = event.body ? JSON.parse(event.body) : {
        body: {
            pt: '',
            en: '',
            es: ''
        },
    };
    let errors: string[] = validateAdvertisement(req);
    if (req && errors.length == 0) {
        const entity = await toAdvertisementEntity(req);
        if (await upsertAdvertisementAsync(entity, config.s3.bucket))
            return {
                success: true,
                data: true
            }
        else {
            errors = ["Failed to Update Advertisement - Please, contact suport!"];
        }
    }
    return {
        success: false,
        errors: errors
    };
}