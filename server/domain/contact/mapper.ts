import { Contact, ContactRow } from "./types";

export function mapRowToContact(
    input: ContactRow
): Contact {
    return {
        body: {
            pt: input.body_pt.trim(),
            en: input.body_en.trim(),
            es: input.body_es.trim(),
        }
    };
}