import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { handleAuthentication } from './handler';

export const lambdaHandler: APIGatewayProxyHandlerV2 = async (event) => {
  if (event.body) {
    const rawBody = (event as any).isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body;

    const params = new URLSearchParams(rawBody);
    const email = params.get('email') ?? null;
    const password = params.get('password') ?? null;

    if (email && password) {
      const jwt = await handleAuthentication(email, password);
      if (jwt) {
        return {
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(jwt),
        };
      }
    }
  }
  return {
    statusCode: 401,
    headers: { 'content-type': 'application/json' },
    body: '',
  };
};