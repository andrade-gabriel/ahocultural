import type { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { handlePreSignedUrl } from './handler';

export const lambdaHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    const body = event.body ? JSON.parse(event.body) : {};
    const { contentType } = body;

    const response = await handlePreSignedUrl(contentType);
    return {
        statusCode: response.success ? 200 : 400,
        headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods': '*'
        },
        body: JSON.stringify(response)
    };
};