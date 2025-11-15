import { config } from './config'
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { DefaultResponse } from "@utils/response/types"
import { Event, EventListItem } from '@event/types';
import { validateEvent } from '@event/validator';
import { getEventAsync, insertEventAsync, listEventsAsync, updateEventActiveAsync, updateEventAsync } from '@event/store';

type HandlerFn = (event: APIGatewayProxyEvent) => Promise<DefaultResponse>;
const handlerFactory = new Map<string, HandlerFn>([
    ["/v1/admin/event", listIdHandler],
    ["/v1/admin/event/{id}", getByIdHandler]
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
        const event: Event | undefined = await getEventAsync(config, id);
        if (event) {
            return {
                success: true,
                data: event
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

    const events: EventListItem[] = await listEventsAsync(config, skip, take, name);
    return {
        success: true,
        data: events
    };
}

export async function postHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req = event.body ? JSON.parse(event.body) : {
        title: { pt: "", en: "", es: "" },
        slug: { pt: "", en: "", es: "" },
        body: { pt: "", en: "", es: "" },

        categoryId: 0,
        companyId: 0,

        heroImage: "",
        thumbnail: "",

        startDate: new Date(),
        endDate: new Date(),

        pricing: 0,
        externalTicketLink: "",

        facilities: [],

        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),

        recurrence: undefined,
        occurrences: undefined,
        sponsoredPeriods: undefined
    };
    let errors: string[] = validateEvent(req);
    if (errors.length == 0) {
        if (await insertEventAsync(config, req))
            return {
                success: true,
                data: true
            }
        else
            errors = ["Failed to Insert Event - Please, contact suport!"];
    }
    return {
        success: false,
        errors: errors
    };
}

export async function putHandler(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const req: Event = event.body ? JSON.parse(event.body) : {
        id: 0,
        title: { pt: "", en: "", es: "" },
        slug: { pt: "", en: "", es: "" },
        body: { pt: "", en: "", es: "" },

        categoryId: 0,
        companyId: 0,

        heroImage: "",
        thumbnail: "",

        startDate: new Date(),
        endDate: new Date(),

        pricing: 0,
        externalTicketLink: "",

        facilities: [],

        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),

        recurrence: undefined,
        occurrences: undefined,
        sponsoredPeriods: undefined
    };
    let errors: string[] = validateEvent(req);
    if (req && errors.length == 0) {
        if (await updateEventAsync(config, req))
            return {
                success: true,
                data: true
            }
        else {
            errors = ["Failed to Update Event - Please, contact suport!"];
        }
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
            data: await updateEventActiveAsync(config, id, req.active)
        }
    }
    return {
        success: false,
        errors: errors
    };
}