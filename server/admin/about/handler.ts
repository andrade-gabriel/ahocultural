import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { AboutEntity, AboutRequest } from '@about/types';
import { validateAbout } from '@about/validator';
import { toAboutEntity, toAboutRequest } from '@about/mapper';
import { getAboutAsync, upsertAboutAsync } from '@about/store';

export async function getHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const articleEntity: AboutEntity | undefined = await getAboutAsync(config.s3.bucket);
    if (articleEntity) {
        return {
            success: true,
            data: toAboutRequest(articleEntity)
        };
    }
    return {
        success: true,
        data: null
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        body: {
            pt: '',
            en: '',
            es: ''
        },
    };
    let errors: string[] = validateAbout(req);
    if (errors.length == 0) {

        const articleEntity = await toAboutEntity(req);
        if (await upsertAboutAsync(articleEntity, config.s3.bucket))
            return {
                success: true,
                data: true
            }
        else
            errors = ["Failed to Insert About - Please, contact suport!"];
    }
    return {
        success: false,
        errors: errors
    };
}

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req: AboutRequest = event.body ? JSON.parse(event.body) : {
        body: {
            pt: '',
            en: '',
            es: ''
        },
    };
    let errors: string[] = validateAbout(req);
    if (req && errors.length == 0) {
        const articleEntity = await toAboutEntity(req);
        if (await upsertAboutAsync(articleEntity, config.s3.bucket))
            return {
                success: true,
                data: true
            }
        else {
            errors = ["Failed to Update About - Please, contact suport!"];
        }
    }
    return {
        success: false,
        errors: errors
    };
}