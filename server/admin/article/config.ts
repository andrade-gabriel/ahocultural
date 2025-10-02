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
  },
  sns: {
    articleTopic: requireEnv("ARTICLE_NOTIFIER"),
  },
  elasticsearch: {
    domain: requireEnv("OPENSEARCH_ENDPOINT").replace(/\/+$/, ""),
    articleIndex: requireEnv("ARTICLE_INDEX")
  }
};