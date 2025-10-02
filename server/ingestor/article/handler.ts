import { config } from './config'
import { getArticleAsync } from "@article/store";
import { ArticleEntity, ArticleIndex } from "@article/types";
import { toArticleIndex } from "@article/mapper";
import { postAsync } from "@article/indexer";

export async function indexAsync(id: string) : Promise<boolean> {
    const article: ArticleEntity | undefined = await getArticleAsync(id, config.s3.bucket);
    if(article)
    {
        const articleIndex: ArticleIndex = toArticleIndex(article);
        return await postAsync(config, articleIndex);
    }
    throw new Error(`Article does not exists: ${id}`);
} 