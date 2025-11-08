import { config } from './config'
import { getEventAsync } from "@event/store";
import { EventEntity, EventIndex } from "@event/types";
import { toEventIndex, toEventIndexes } from "@event/mapper";
import { bulkUpsertAsync, deleteByQueryAsync, postAsync } from "@event/indexer";
import { CompanyEntity } from '@company/types';
import { getCompanyAsync } from '@company/store';

export async function indexAsync(id: string): Promise<boolean> {
    const event: EventEntity | undefined = await getEventAsync(id, config.s3.bucket);
    if (event) {
        const company: CompanyEntity | undefined = await getCompanyAsync(event.company, config.s3.bucket);
        if (company) {
            if(event.recurrence){
                const successfullyDeleted = await deleteByQueryAsync(config, event.id);
                if(successfullyDeleted)
                {
                    const eventIndexes: EventIndex[] = toEventIndexes(event, company)
                    return await bulkUpsertAsync(config, eventIndexes)
                }
                throw new Error(`Failed to delete events`);
            }
            else
            {
                const eventIndex: EventIndex = toEventIndex(event, company);
                return await postAsync(config, eventIndex);
            }
        }
    }
    throw new Error(`Event does not exists: ${id}.`);
} 