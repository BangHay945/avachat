export const config = {
  PORT: process.env.PORT || "4000",
  JWT_SECRET: process.env.JWT_SECRET || "avachat-dev-secret",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL || "postgres://avachat:avachat@localhost:5432/avachat",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  NODE_ENV: process.env.NODE_ENV || "development",
  SALT_ROUNDS: 10,
} as const;
