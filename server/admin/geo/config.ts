function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  database: {
    host: requireEnv("DATABASE_HOST"),
    port: parseInt(requireEnv("DATABASE_PORT"), 10),
    user: requireEnv("DATABASE_USER"),
    password: requireEnv("DATABASE_PASSWORD"),
    name: requireEnv("DATABASE_NAME"),
    ssl: requireEnv("DATABASE_SSL")?.toLowerCase().trim() === 'true'
  }
};