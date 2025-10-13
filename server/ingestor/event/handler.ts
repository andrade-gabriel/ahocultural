import { config } from './config'
import { getEventAsync } from "@event/store";
import { EventEntity, EventIndex } from "@event/types";
import { toEventIndex } from "@event/mapper";
import { postAsync } from "@event/indexer";
import { CompanyEntity } from '@company/types';
import { getCompanyAsync } from '@company/store';
import { CategoryEntity } from '@category/types';
import { getCategoryAsync } from '@category/store';

export async function indexAsync(id: string) : Promise<boolean> {
    const event: EventEntity | undefined = await getEventAsync(id, config.s3.bucket);
    if(event)
    {
        const company: CompanyEntity | undefined = await getCompanyAsync(event.company, config.s3.bucket);
        if(company){
            const category: CategoryEntity | undefined = await getCategoryAsync(event.category, config.s3.bucket);
            if(category){
                const eventIndex: EventIndex = toEventIndex(event, company, category);
                return await postAsync(config, eventIndex);
            }
        }
    }
    throw new Error(`Event does not exists: ${id}.`);
} 