import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { Contact } from '@contact/types';
import { validateContact } from '@contact/validator';
import { getContactAsync, insertContactAsync, updateContactAsync } from '@contact/store';

export async function getHandler(): Promise<DefaultResponse> {
    const article: Contact | undefined = await getContactAsync(config);
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
    let errors: string[] = validateContact(req);
    if (errors.length == 0) {
        if (await insertContactAsync(config, req))
            return {
                success: true,
                data: true
            }
        else
            errors = ["Failed to Insert Contact - Please, contact suport!"];
    }
    return {
        success: false,
        errors: errors
    };
}

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req: Contact = event.body ? JSON.parse(event.body) : {
        body: {
            pt: '',
            en: '',
            es: ''
        },
    };
    let errors: string[] = validateContact(req);
    if (req && errors.length == 0) {
        if (await updateContactAsync(config, req))
            return {
                success: true,
                data: true
            }
        else {
            errors = ["Failed to Update Contact - Please, contact suport!"];
        }
    }
    return {
        success: false,
        errors: errors
    };
}