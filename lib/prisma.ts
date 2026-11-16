import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/** True when a database is configured; otherwise submissions use the local fallback store. */
export const databaseEnabled = Boolean(process.env.DATABASE_URL);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Lazily created Prisma client (one per process, reused across hot reloads).
 * Only call this when `databaseEnabled` is true.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
