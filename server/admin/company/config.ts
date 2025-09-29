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
    companyTopic: requireEnv("COMPANY_NOTIFIER"),
  },
  elasticsearch: {
    domain: requireEnv("OPENSEARCH_ENDPOINT").replace(/\/+$/, ""),
    companyIndex: requireEnv("COMPANY_INDEX")
  }
};