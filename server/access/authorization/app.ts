import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from "aws-lambda";
import jwt from "jsonwebtoken";
import { config } from './config'

const JWT_SECRET = config.jwt.secret;

export async function lambdaHandler(
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
    try {
        const [scheme, token] = event.authorizationToken.split(" ");
        if (!/^Bearer$/i.test(scheme) || !token) {
            throw new Error("Invalid auth header");
        }
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
        return {
            principalId: (decoded as any).email || "user",
            policyDocument: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "execute-api:Invoke",
                        Effect: "Allow",
                        Resource: event.methodArn,
                    },
                ],
            },
            context: {
                email: (decoded as any).email || "",
                firstName: (decoded as any).firstName || "",
            },
        };
    } catch {
        return {
            principalId: "anonymous",
            policyDocument: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "execute-api:Invoke",
                        Effect: "Deny",
                        Resource: event.methodArn,
                    },
                ],
            },
        };
    }
}
