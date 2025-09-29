import { CompanyPayload } from "./types";
import { config } from "./config";
import { SNSClient, PublishCommand, PublishCommandOutput } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: 'us-east-1' });

export async function notifyAsync(payload: CompanyPayload): Promise<boolean> {
  try {
    const notifier = config.sns.companyNotifier;
    const command = new PublishCommand({
      TopicArn: notifier,
      Message: JSON.stringify(payload),
    });
    const res : PublishCommandOutput = await sns.send(command);
    return true;
  } catch (err) {
    throw new Error("Failed to Publish Message to SNS");
  }
}
