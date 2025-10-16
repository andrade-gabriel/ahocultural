import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { LocationEntity, LocationIndex } from '@location/types';
import { toLocationRequest } from '@location/mapper';
import { getLocationAsync } from '@location/store';
import { getAsync } from '@location/indexer';

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

    const indexedLocations: LocationIndex[] = await getAsync(config, skip, take, name, true);
    return {
        success: true,
        data: indexedLocations
    };
}