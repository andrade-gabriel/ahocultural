import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export const lambdaHandler: APIGatewayProxyHandlerV2 = async (event) => {
    console.log(event);
    return {
        statusCode: 200,
        headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods': '*'
        },
        body: 'ok',
    };
};