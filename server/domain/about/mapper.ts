import { AboutRequest, AboutEntity } from "./types";

export function toAboutEntity(
    input: AboutRequest
): AboutEntity {
    return {
        body: {
            pt: input.body.pt.trim(),
            en: input.body.en.trim(),
            es: input.body.es.trim(),
        }
    };
}

export function toAboutRequest(
    input: AboutEntity
): AboutRequest {
    return {
        body: {
            pt: input.body.pt.trim(),
            en: input.body.en.trim(),
            es: input.body.es.trim(),
        },
    };
}