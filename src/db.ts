import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const url = process.env.DATABASE_URL;
const adapter = url.includes(".neon.tech")
	? new PrismaNeon({ connectionString: url })
	: new PrismaPg({ connectionString: url });

declare global {
	var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalThis.__prisma = prisma;
}
