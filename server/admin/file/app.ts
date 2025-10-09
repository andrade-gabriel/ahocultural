import type { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { handlePreSignedUrl, getPreview } from './handler';
import { DefaultResponse } from '@utils/response/types';

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<DefaultResponse>;
const handlerFactory = new Map<string, HandlerFn>([
    ["get", getPreview],
    ["post", handlePreSignedUrl]
]);

export const lambdaHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    const method = event.httpMethod.toLowerCase();
    console.log(method)
    const handler = handlerFactory.get(method);
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
            body: JSON.stringify(res)
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