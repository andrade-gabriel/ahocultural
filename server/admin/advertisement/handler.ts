import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { Advertisement } from '@advertisement/types';
import { validateAdvertisement } from '@advertisement/validator';
import { getAdvertisementAsync, insertAdvertisementAsync, updateAdvertisementAsync } from '@advertisement/store';

export async function getHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const article: Advertisement | undefined = await getAdvertisementAsync(config);
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
        if (await insertAdvertisementAsync(config, req))
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
    const req: Advertisement = event.body ? JSON.parse(event.body) : {
        body: {
            pt: '',
            en: '',
            es: ''
        },
    };
    let errors: string[] = validateAdvertisement(req);
    if (req && errors.length == 0) {
        if (await updateAdvertisementAsync(config, req))
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