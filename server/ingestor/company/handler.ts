import { config } from './config'
import { getCompanyAsync } from "@company/store";
import { CompanyEntity, CompanyIndex } from "@company/types";
import { toCompanyIndex } from "@company/mapper";
import { postAsync } from "@company/indexer";

export async function indexAsync(id: string) : Promise<boolean> {
    const company: CompanyEntity | undefined = await getCompanyAsync(id, config.s3.bucket);
    if(company)
    {
        const companyIndex: CompanyIndex = toCompanyIndex(company);
        return await postAsync(config, companyIndex);
    }
    throw new Error(`Company does not exists: ${id}`);
} 