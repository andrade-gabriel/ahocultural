import type { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { getAdvertisementAsync } from '@advertisement/store';
import { config } from './config'

export const lambdaHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    const item = await getAdvertisementAsync(config.s3.bucket);
    return {
        statusCode: item ? 200 : 204,
        headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods': '*'
        },
        body: JSON.stringify(item),
    };
};