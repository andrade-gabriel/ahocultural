import { config } from './config'
import { getCategoryAsync } from "@category/store";
import { CategoryEntity, CategoryIndex } from "@category/types";
import { toCategoryIndex } from "@category/mapper";
import { postAsync } from "@category/indexer";

export async function indexAsync(id: string) : Promise<boolean> {
    const category: CategoryEntity | undefined = await getCategoryAsync(id, config.s3.bucket);
    if(category)
    {
        let parent: CategoryEntity | undefined = undefined;
        if(category.parent_id){
            // gets more data
            parent = await getCategoryAsync(category.parent_id, config.s3.bucket);
        }

        const categoryIndex: CategoryIndex = toCategoryIndex(category, parent);
        return await postAsync(config, categoryIndex);
    }
    throw new Error(`Category does not exists: ${id}`);
} 