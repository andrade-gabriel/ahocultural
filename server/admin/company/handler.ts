import type { APIGatewayProxyEvent } from 'aws-lambda';
import { tryParseJson } from '../shared/request/parser';
import { CompanyEntity, CompanyRequest, CompanyToggleRequest } from './types';
import { DefaultResponse } from "../shared/response/types"
import { validateCompany } from './validator';
import { toCompanyEntity, toCompanyRequest } from './mapper';
import { getCompanyAsync, upsertCompanyAsync } from './store';
import { config } from './config'

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<DefaultResponse>;
const handlerFactory = new Map<string, HandlerFn>([
    ["/v1/admin/company", listIdHandler],
    ["/v1/admin/company/{id}", getByIdHandler]
]);

// Only determines which get will be triggered
export async function getHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const resource = event.resource.toLowerCase();
    const handler = handlerFactory.get(resource);
    if (handler)
        return await handler(event);
    return {
        success: false,
        errors: ["Invalid Operation"]
    };
}

export async function getByIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const id: string | undefined = event.pathParameters?.id;
    if (id) {
        const companyEntity: CompanyEntity | undefined = await getCompanyAsync(id, config.s3.bucket);
        if (companyEntity) {
            return {
                success: true,
                data: toCompanyRequest(companyEntity)
            };
        }
        return {
            success: true,
            data: null
        };
    }

    return {
        success: false,
        errors: ["O campo `id` deve ser preenchido"]
    };
}

export async function listIdHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    return {
        success: true,
        data: null
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req: CompanyRequest = tryParseJson<CompanyRequest>(event.body, {
        id: "",
        name: "",
        address: {
            street: "",
            number: "",
            complement: "",
            district: "",
            city: "",
            state: "",
            state_full: "",
            postal_code: "",
            country: "",
            country_code: ""
        },
        geo: {
            lat: null,
            lng: null
        },
        active: true
    });
    let errors: string[] = validateCompany(req);
    if (errors.length == 0) {
        const existingCompanyEntity: CompanyEntity | undefined = await getCompanyAsync(req.id, config.s3.bucket);
        const companyEntity = await toCompanyEntity(req, existingCompanyEntity);
        if (!await upsertCompanyAsync(companyEntity, config.s3.bucket))
            errors = ["Failed to Upsert Company - Please, contact suport."];
        else
            return {
                success: true,
                data: true
            }
    }
    return {
        success: false,
        errors: errors
    };
}

export async function patchHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const id: string | undefined = event.pathParameters?.id;
    const req: CompanyToggleRequest = tryParseJson<CompanyToggleRequest>(event.body, {
        active: false
    });
    let errors: string[] = [];
    if (!id)
        errors.push('Campo `id` deve ser preenchido.');

    if (req.active != null && id && errors.length == 0) {
        const existingCompanyEntity: CompanyEntity | undefined = await getCompanyAsync(id, config.s3.bucket);
        if (existingCompanyEntity) {
            existingCompanyEntity.active = req.active;
            if (!await upsertCompanyAsync(existingCompanyEntity, config.s3.bucket))
                errors = ["Failed to Upsert Company `" + id + "`- Please, contact suport."];
            else
                return {
                    success: true,
                    data: true
                }
        } else
            errors: ["Empresa `" + id + "` não existe para ser alterada"]
    }
    return {
        success: false,
        errors: errors
    };
}