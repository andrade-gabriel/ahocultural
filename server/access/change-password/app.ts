import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export const lambdaHandler: APIGatewayProxyHandlerV2 = async (event) => {
    console.log(event);
    return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: 'ok',
    };
};