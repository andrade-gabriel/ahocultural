import type { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getHandler, postHandler, patchHandler } from './handler'
import { DefaultResponse } from '@utils/response/types';

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<DefaultResponse>;
const handlerFactory = new Map<string, HandlerFn>([
    ["get", getHandler],
    ["post", postHandler],
    ["patch", patchHandler],
]);

export const lambdaHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    const method = event.httpMethod.toLowerCase();
    console.log(method)
    const handler = handlerFactory.get(method);
    if (handler) {
        const res = await handler(event);
        return {
            statusCode: res.success ? 200 : 400,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(res),
        };
    }
    console.log('500.1')
    return {
        statusCode: 500,
        headers: { 'content-type': 'application/json' },
        body: ''
    };
};