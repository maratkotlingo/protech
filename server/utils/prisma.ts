import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

function getIntegerEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name]);

  if (!Number.isInteger(value) || value < min || value > max) {
    return fallback;
  }

  return value;
}

const maxPoolSize = getIntegerEnv("DATABASE_POOL_MAX", 10, 1, 100);
const minPoolSize = getIntegerEnv("DATABASE_POOL_MIN", 0, 0, maxPoolSize);

const pool = new Pool({
  connectionString,
  max: maxPoolSize,
  min: minPoolSize,
  statement_timeout: getIntegerEnv("DATABASE_STATEMENT_TIMEOUT_MS", 10000, 1000, 60000),
  connectionTimeoutMillis: getIntegerEnv("DATABASE_CONNECTION_TIMEOUT_MS", 5000, 1000, 60000),
  idleTimeoutMillis: getIntegerEnv("DATABASE_IDLE_TIMEOUT_MS", 15000, 1000, 120000),
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
