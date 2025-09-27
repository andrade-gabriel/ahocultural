import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { tryParseJson } from '../shared/request/parser';
import { DefaultResponse } from '../shared/response/types';
import { UserSaveRequest } from '../shared/users/types';
import { handleSaveUserAsync } from '../shared/users/handler'

export const lambdaHandler: APIGatewayProxyHandlerV2 = async (event) => {
  const req: UserSaveRequest = tryParseJson<UserSaveRequest>(event.body, {
    email: "",
    password: "",
    firstName: "",
  });

  console.log("Request:", req);

  try{
    const res: DefaultResponse = await handleSaveUserAsync(req);

    return {
      statusCode: res.success ? 200 : 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(res),
    };
  } catch(e){
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: "Internal Server Error!",
    };
  }
};