import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { Ad, AdListItem, AdMenuType, AdType } from '@ad/types';
import { validateAd } from '@ad/validator';
import { getAdAsync, insertAdAsync, listAdsAsync, updateAdActiveAsync, updateAdAsync } from '@ad/store';

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<DefaultResponse>;
const handlerFactory = new Map<string, HandlerFn>([
    ["/v1/admin/ad", listIdHandler],
    ["/v1/admin/ad/{id}", getByIdHandler]
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
        const ad: Ad | undefined = await getAdAsync(config, id);
        if (ad) {
            return {
                success: true,
                data: ad
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

    const ads: AdListItem[] = await listAdsAsync(config, skip, take, name);
    return {
        success: true,
        data: ads
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        type: AdType.Menu,
        startDate: new Date(),
        endDate: new Date(),
        title: {
            pt: "",
            en: "",
            es: "",
        },
        thumbnail: "",
        pricing: 0,
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        menuType: AdMenuType.Today,
    };
    let errors: string[] = validateAd(req);
    if (errors.length == 0) {
        if (await insertAdAsync(config, req))
            return {
                success: true,
                data: true
            }
        else
            errors = ["Failed to Insert Ad - Please, contact suport!"];
    }
    return {
        success: false,
        errors: errors
    };
}

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req: Ad = event.body ? JSON.parse(event.body) : {
        id: 0,
        type: AdType.Menu,
        startDate: new Date(),
        endDate: new Date(),
        title: {
            pt: "",
            en: "",
            es: "",
        },
        thumbnail: "",
        pricing: 0,
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        menuType: AdMenuType.Today,
    };
    let errors: string[] = validateAd(req);
    if (req && errors.length == 0) {
        if (await updateAdAsync(config, req))
            return {
                success: true,
                data: true
            }
        else {
            errors = ["Failed to Update Ad - Please, contact suport!"];
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
            data: await updateAdActiveAsync(config, id, req.active)
        }
    }
    return {
        success: false,
        errors: errors
    };
}