import { AdvertisementRequest, AdvertisementEntity } from "./types";

export function toAdvertisementEntity(
    input: AdvertisementRequest
): AdvertisementEntity {
    return {
        body: {
            pt: input.body.pt.trim(),
            en: input.body.en.trim(),
            es: input.body.es.trim(),
        }
    };
}

export function toAdvertisementRequest(
    input: AdvertisementEntity
): AdvertisementRequest {
    return {
        body: {
            pt: input.body.pt.trim(),
            en: input.body.en.trim(),
            es: input.body.es.trim(),
        },
    };
}