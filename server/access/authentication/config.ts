function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  jwt: {
    secret: requireEnv("JWT_SECRET"),
    expiresInSeconds: parseInt(requireEnv("JWT_EXPIRES_IN"), 10),
  },
  s3: {
    bucket: requireEnv("BUCKET_DATABASE"),
  },
};