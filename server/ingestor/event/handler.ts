import { config } from './config'
import { getEventAsync } from "@event/store";
import { EventEntity, EventIndex } from "@event/types";
import { toEventIndex } from "@event/mapper";
import { postAsync } from "@event/indexer";

export async function indexAsync(id: string) : Promise<boolean> {
    const event: EventEntity | undefined = await getEventAsync(id, config.s3.bucket);
    if(event)
    {
        const eventIndex: EventIndex = toEventIndex(event);
        return await postAsync(config, eventIndex);
    }
    throw new Error(`Event does not exists: ${id}`);
} 