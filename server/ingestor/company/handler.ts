import { getCompanyAsync } from "./store";
import { config } from './config'
import { CompanyEntity, CompanyIndex } from "./types";
import { toCompanyIndex } from "./mapper";
import { postAsync } from "./index";

export async function indexAsync(id: string) : Promise<boolean> {
    const company: CompanyEntity | undefined = await getCompanyAsync(id, config.s3.bucket);
    if(company)
    {
        const companyIndex: CompanyIndex = toCompanyIndex(company);
        return await postAsync(companyIndex);
    }
    throw new Error(`Company does not exists: ${id}`);
} 