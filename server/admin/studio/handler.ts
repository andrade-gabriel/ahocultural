import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { Studio } from '@studio/types';
import { validateStudio } from '@studio/validator';
import { getStudioAsync, insertStudioAsync, updateStudioAsync } from '@studio/store';

export async function getHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const item: Studio | undefined = await getStudioAsync(config);
    if (item) {
        return {
            success: true,
            data: item
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
    let errors: string[] = validateStudio(req);
    if (errors.length == 0) {
        if (await insertStudioAsync(config, req))
            return {
                success: true,
                data: true
            }
        else
            errors = ["Failed to Insert Studio - Please, contact suport!"];
    }
    return {
        success: false,
        errors: errors
    };
}

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req: Studio = event.body ? JSON.parse(event.body) : {
        body: {
            pt: '',
            en: '',
            es: ''
        },
    };
    let errors: string[] = validateStudio(req);
    if (req && errors.length == 0) {
        if (await updateStudioAsync(config, req))
            return {
                success: true,
                data: true
            }
        else {
            errors = ["Failed to Update Studio - Please, contact suport!"];
        }
    }
    return {
        success: false,
        errors: errors
    };
}