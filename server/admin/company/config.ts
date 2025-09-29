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
    companyNotifier: requireEnv("COMPANY_NOTIFIER"),
  },
  elasticsearch: {
    domain: requireEnv("OPENSEARCH_ENDPOINT").replace(/\/+$/, ""),
    company_index: requireEnv("COMPANY_INDEX")
  }
};