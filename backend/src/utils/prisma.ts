import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

prisma.$on("error" as never, (e: unknown) => {
  logger.error(e, "Prisma error");
});

prisma.$on("warn" as never, (e: unknown) => {
  logger.warn(e, "Prisma warning");
});
