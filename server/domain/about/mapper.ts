import { About, AboutRow } from "./types";

export function mapRowToAbout(
    input: AboutRow
): About {
    return {
        body: {
            pt: input.body_pt.trim(),
            en: input.body_en.trim(),
            es: input.body_es.trim(),
        }
    };
}