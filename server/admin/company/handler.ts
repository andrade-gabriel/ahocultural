import type { APIGatewayProxyEvent } from 'aws-lambda';
import { config } from './config'
import { tryParseJson } from '@utils/request/parser';
import { DefaultResponse } from "@utils/response/types"
import { CompanyEntity, CompanyIndex, CompanyListRequest, CompanyRequest, CompanyToggleRequest } from '@company/types';
import { validateCompany } from '@company/validator';
import { toCompanyEntity, toCompanyListRequest, toCompanyRequest } from '@company/mapper';
import { getCompanyAsync, upsertCompanyAsync } from '@company/store';
import { notifyAsync } from '@company/notifier';
import { getAsync } from '@company/indexer';
import { randomUUID } from 'node:crypto';

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
    const qs = event.queryStringParameters || {};

    const skip = qs.skip ? parseInt(qs.skip, 10) : 0;
    const take = qs.take ? parseInt(qs.take, 10) : 10;
    const name = qs.name ? qs.name : null;

    const indexedCompanies: CompanyIndex[] = await getAsync(config, skip, take, name);
    const companies: CompanyListRequest[] = indexedCompanies.map(indexedCompany => toCompanyListRequest(indexedCompany));
    return {
        success: true,
        data: companies
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        id: "",
        name: "",
        slug: "",
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
    };
    let errors: string[] = validateCompany(req);
    if (errors.length == 0) {
        req.id = randomUUID();
        const companyEntity = await toCompanyEntity(req, undefined);
        if (!await upsertCompanyAsync(companyEntity, config.s3.bucket))
            errors = ["Failed to Insert Company - Please, contact suport."];
        else {
            if (await notifyAsync(config.sns.companyTopic, {
                id: req.id
            }))
                return {
                    success: true,
                    data: req.id
                }
        }
    }
    return {
        success: false,
        errors: errors
    };
}

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        id: "",
        name: "",
        slug: "",
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
    };
    // Force Id in put handler
    req.id = event.pathParameters?.id ?? '';
    let errors: string[] = validateCompany(req);
    if (errors.length == 0) {
        const existingCompanyEntity: CompanyEntity | undefined = await getCompanyAsync(req.id, config.s3.bucket);
        if (existingCompanyEntity) {
            const companyEntity = await toCompanyEntity(req, existingCompanyEntity);
            if (!await upsertCompanyAsync(companyEntity, config.s3.bucket))
                errors = ["Failed to Update Company - Please, contact suport."];
            else {
                if (await notifyAsync(config.sns.companyTopic, {
                    id: req.id
                }))
                    return {
                        success: true,
                        data: true
                    }
            }
        }
        else
            errors = ["Cannot Update a Company that does not exists."];
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
            else {
                if (await notifyAsync(config.sns.companyTopic, {
                    id
                }))
                    return {
                        success: true,
                        data: true
                    }
            }
        } else
            errors = ["Empresa `" + id + "` não existe para ser alterada"]
    }
    return {
        success: false,
        errors: errors
    };
}