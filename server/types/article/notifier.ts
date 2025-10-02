import { ArticlePayload } from "./types";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: 'us-east-1' });

export async function notifyAsync(snsTopic: string, payload: ArticlePayload): Promise<boolean> {
  try {
    const command = new PublishCommand({
      TopicArn: snsTopic,
      Message: JSON.stringify(payload),
    });
    await sns.send(command);
    return true;
  } catch (err) {
    throw new Error("Failed to Publish Message to SNS");
  }
}
