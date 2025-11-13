import type { APIGatewayProxyEvent } from 'aws-lambda';
import { config } from './config'
import { DefaultResponse } from "@utils/response/types"
import { Location, LocationListItem } from '@location/types';
import { validateLocation } from '@location/validator';
import { toLocation } from '@location/mapper';
import { getLocationAsync, getLocationWithDistrictsAsync, insertLocationAsync, listLocationsAsync, updateLocationActiveAsync, updateLocationAsync } from '@location/store';

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
    const idParam = event.pathParameters?.id;
    const id: number | undefined = idParam ? parseInt(idParam, 10) : undefined;
    if (id) {
        const location: Location | undefined = await getLocationWithDistrictsAsync(config, id);
        if (location) {
            return {
                success: true,
                data: location
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

    const locations: LocationListItem[] = await listLocationsAsync(config, skip, take, name);
    return {
        success: true,
        data: locations
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        country: "",
        countrySlug: "",
        state: "",
        stateSlug: "",
        city: "",
        citySlug: "",
        description: "",
        active: true,
        districts: null
    };
    let errors: string[] = validateLocation(req);
    if (errors.length == 0) {
        const location = await toLocation(req, undefined);
        const id = await insertLocationAsync(config, location);
        if (id)
            return {
                success: true,
                data: id
            }
        else
            errors = ["Failed to Insert Location - Please, contact suport."];
    }
    return {
        success: false,
        errors: errors
    };
}

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        id: 0,
        country: "",
        countrySlug: "",
        state: "",
        stateSlug: "",
        city: "",
        citySlug: "",
        description: "",
        active: true,
        districts: null
    };
    // Force Id in put handler
    req.id = event.pathParameters?.id ?? '';
    let errors: string[] = validateLocation(req);
    if (errors.length == 0) {
        const existingLocation: Location | undefined = await getLocationAsync(config, req.id);
        if (existingLocation) {
            const location = await toLocation(req, existingLocation);
            return {
                success: true,
                data: await updateLocationAsync(config, location)
            }
        }
        else
            errors = ["Cannot Update a Location that does not exists."];
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
            data: await updateLocationActiveAsync(config, id, req.active)
        }
    }
    return {
        success: false,
        errors: errors
    };
}
