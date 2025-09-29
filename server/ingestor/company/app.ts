import type { SQSEvent, SQSHandler, SQSRecord } from "aws-lambda";
import { CompanyEntity, CompanyPayload } from "./types";
import { tryParseJson } from "../shared/request/parser";
import { indexAsync } from "./handler";

export const lambdaHandler: SQSHandler = async (event: SQSEvent) => {
    for (const record of event.Records) {
        try {
            const req: CompanyPayload = tryParseJson<CompanyPayload>(record.body, {
                id: ""
            });
            if(!req.id)
                throw new Error(`Invalid Id: ${req.id}`);

            if(!await indexAsync(req.id))
                throw new Error(`Failed to index: ${req.id}`);    
        } catch (err) {
            console.error("Error:", err);
            throw err;
        }
    }
};