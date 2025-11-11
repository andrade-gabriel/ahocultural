import type { APIGatewayProxyEvent } from 'aws-lambda';
import { config } from './config'
import { DefaultResponse } from "@utils/response/types"
import { Company, CompanyListItem } from '@company/types';
import { validateCompany } from '@company/validator';
import { toCompanyEntity } from '@company/mapper';
import { getCompanyAsync, insertCompanyAsync, listCompaniesAsync, updateCompanyActiveAsync, updateCompanyAsync } from '@company/store';

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
    const idParam = event.pathParameters?.id;
    const id: number | undefined = idParam ? parseInt(idParam, 10) : undefined;
    if (id) {
        const company: Company | undefined = await getCompanyAsync(config, id);
        if (company) {
            return {
                success: true,
                data: company
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

    const indexedCompanies: CompanyListItem[] = await listCompaniesAsync(config, skip, take, name);
    return {
        success: true,
        data: indexedCompanies
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
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
        const company = await toCompanyEntity(req, undefined);
        const id = await insertCompanyAsync(config, company);
        if (id)
            return {
                success: true,
                data: id
            }
        else
            errors = ["Failed to Insert Company - Please, contact suport."];
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
        const existingCompanyEntity: Company | undefined = await getCompanyAsync(config, req.id);
        if (existingCompanyEntity) {
            const company = await toCompanyEntity(req, existingCompanyEntity);
            return {
                success: true,
                data: await updateCompanyAsync(config, company)
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
    const idParam = event.pathParameters?.id;
    const id: number | undefined = idParam ? parseInt(idParam, 10) : undefined;
    const req = event.body ? JSON.parse(event.body) : {
        active: false
    };
    let errors: string[] = [];
    if (!id)
        errors.push('Campo `id` deve ser preenchido.');

    if (req.active != null && id && errors.length == 0) {
        return {
            success: true,
            data: await updateCompanyActiveAsync(config, id, req.active)
        }
    }
    return {
        success: false,
        errors: errors
    };
}