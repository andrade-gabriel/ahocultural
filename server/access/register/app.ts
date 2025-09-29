import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { tryParseJson } from '@utils/request/parser'; 
import { DefaultResponse } from '@utils/response/types';
import { UserSaveRequest } from '@user/types';
import { handleSaveUserAsync } from './handler'
import { config } from './config'

export const lambdaHandler: APIGatewayProxyHandlerV2 = async (event) => {
  const req: UserSaveRequest = tryParseJson<UserSaveRequest>(event.body, {
    email: "",
    password: "",
    firstName: "",
  });

  console.log("Request:", req);

  try{
    const res: DefaultResponse = await handleSaveUserAsync(req, config.s3.bucket);

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