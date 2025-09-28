import type { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';

export const lambdaHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    console.log('test')
    return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(event)
    };
};