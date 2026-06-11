import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { prisma } from "#/db";

export const TEST_USER_ID = "test-user-recipes";
export const OTHER_USER_ID = "test-user-other";

export async function upsertOtherUser() {
	await prisma.user.upsert({
		where: { id: OTHER_USER_ID },
		create: {
			id: OTHER_USER_ID,
			name: "Other Chef",
			email: "other-chef@test.local",
			emailVerified: false,
			username: "other-chef",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		update: {},
	});
}

export async function cleanupOtherUser() {
	await prisma.user.deleteMany({ where: { id: OTHER_USER_ID } });
}

export function setupTestUser() {
	beforeAll(async () => {
		await prisma.user.upsert({
			where: { id: TEST_USER_ID },
			create: {
				id: TEST_USER_ID,
				name: "Test User",
				email: "test-recipes@test.local",
				emailVerified: false,
				username: "test-recipes-user",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			update: {},
		});
	});

	afterAll(async () => {
		await prisma.user.delete({ where: { id: TEST_USER_ID } });
		await prisma.$disconnect();
	});

	beforeEach(async () => {
		await prisma.recipe.deleteMany({ where: { userId: TEST_USER_ID } });
		await prisma.tag.deleteMany({ where: { userId: TEST_USER_ID } });
		vi.clearAllMocks();
	});
}
