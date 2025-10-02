import { config } from './config'
import { getLocationAsync } from "@location/store";
import { LocationEntity, LocationIndex } from "@location/types";
import { toLocationIndex } from "@location/mapper";
import { postAsync } from "@location/indexer";

export async function indexAsync(id: string) : Promise<boolean> {
    const location: LocationEntity | undefined = await getLocationAsync(id, config.s3.bucket);
    if(location)
    {
        const locationIndex: LocationIndex = toLocationIndex(location);
        return await postAsync(config, locationIndex);
    }
    throw new Error(`Location does not exists: ${id}`);
} 