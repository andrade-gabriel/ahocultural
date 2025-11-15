import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { About } from '@about/types';
import { validateAbout } from '@about/validator';
import { getAboutAsync, insertAboutAsync, updateAboutAsync } from '@about/store';

export async function getHandler(): Promise<DefaultResponse> {
    const article: About | undefined = await getAboutAsync(config);
    if (article) {
        return {
            success: true,
            data: article
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
        if (await insertAboutAsync(config, req))
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
    const req: About = event.body ? JSON.parse(event.body) : {
        body: {
            pt: '',
            en: '',
            es: ''
        },
    };
    let errors: string[] = validateAbout(req);
    if (req && errors.length == 0) {
        if (await updateAboutAsync(config, req))
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