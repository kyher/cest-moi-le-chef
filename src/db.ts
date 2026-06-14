import { PrismaClient } from "./generated/prisma/client.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

declare global {
	var __prisma: PrismaClient | undefined;
}

async function createPrismaClient() {
	if (process.env.NODE_ENV === "production") {
		const { PrismaNeon } = await import("@prisma/adapter-neon");
		const adapter = new PrismaNeon({
			connectionString: process.env.DATABASE_URL,
		});
		return new PrismaClient({ adapter });
	}
	const { PrismaPg } = await import("@prisma/adapter-pg");
	const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
	return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
	globalThis.__prisma ?? (await createPrismaClient());
globalThis.__prisma = prisma;
