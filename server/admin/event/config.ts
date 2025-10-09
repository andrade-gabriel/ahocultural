function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  s3: {
    bucket: requireEnv("BUCKET_DATABASE"),
    assetsBucket: requireEnv("BUCKET_ASSETS"),
  },
  sns: {
    eventTopic: requireEnv("EVENT_NOTIFIER"),
  },
  elasticsearch: {
    domain: requireEnv("OPENSEARCH_ENDPOINT").replace(/\/+$/, ""),
    eventIndex: requireEnv("EVENT_INDEX")
  }
};