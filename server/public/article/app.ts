import type { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { listIdHandler, getByIdHandler, getRelatedByDateFromIdHandler } from './handler'
import { DefaultResponse } from '@utils/response/types';

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<DefaultResponse>;
const handlerFactory = new Map<string, HandlerFn>([
    ["/v1/public/article", listIdHandler],
    ["/v1/public/article/{id}", getByIdHandler],
    ["/v1/public/article/related/{id}", getRelatedByDateFromIdHandler]
]);

export const lambdaHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    const resource = event.resource.toLowerCase();
    const handler = handlerFactory.get(resource);
    if (handler) {
        const res = await handler(event);
        return {
            statusCode: res.success ? 200 : 400,
            headers: {
                'content-type': 'application/json',
                'access-control-allow-origin': '*',
                'access-control-allow-headers': '*',
                'access-control-allow-methods': '*'
            },
            body: JSON.stringify(res),
        };
    }
    console.log('500.1')
    return {
        statusCode: 500,
        headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods': '*'
        },
        body: ''
    };
};