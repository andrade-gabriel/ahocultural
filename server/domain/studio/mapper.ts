import { Studio, StudioRow, StudioCategoryMediaRow, StudioCategory } from "./types";

export function mapRowToStudio(
    input: StudioRow,
    categories: StudioCategoryMediaRow[]
): Studio {
    return {
        body: {
            pt: input.body_pt.trim(),
            en: input.body_en.trim(),
            es: input.body_es.trim(),
        },
        categories: mapRowToStudioCategory(categories)
    };
}

function mapRowToStudioCategory(input: StudioCategoryMediaRow[]): StudioCategory[] {
    let categories: Record<number, StudioCategory> = {};
    for (const category of input) {
        // not exists
        if (!(category.id in categories))
            categories[category.id] = {
                name: {
                    pt: category.name_pt,
                    en: category.name_en,
                    es: category.name_es
                },
                medias: []
            }

        // media
        categories[category.id].medias.push(category.file_path);
    }
    return Object.values(categories);
}