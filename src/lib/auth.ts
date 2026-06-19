import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { prisma } from "#/db";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		username({
			usernameValidator: (u) => /^[a-z0-9_-]+$/.test(u),
		}),
		admin(),
		tanstackStartCookies(),
	],
});
