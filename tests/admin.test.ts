import { describe, expect, it, vi } from "vitest";
import { prisma } from "#/db";
import {
	adminDeleteRecipe,
	adminForcePrivate,
	adminRemoveRecipeImage,
	banUser,
	listAllPublicRecipes,
	listAllUsers,
} from "#/lib/admin-service";
import { createRecipe } from "#/lib/recipe-service";
import {
	cleanupOtherUser,
	OTHER_USER_ID,
	setupTestUser,
	TEST_USER_ID,
	upsertOtherUser,
} from "./helpers";

vi.mock("#/lib/image-storage", () => ({
	deleteImageFile: vi.fn().mockResolvedValue(undefined),
}));

const { deleteImageFile } = await import("#/lib/image-storage");

setupTestUser();

const BAN_TARGET_ID = "test-user-ban-target";

async function upsertBanTarget() {
	await prisma.user.upsert({
		where: { id: BAN_TARGET_ID },
		create: {
			id: BAN_TARGET_ID,
			name: "Ban Target",
			email: "ban-target@test.local",
			emailVerified: false,
			username: "ban-target",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		update: { banned: false },
	});
}

async function cleanupBanTarget() {
	await prisma.user.deleteMany({ where: { id: BAN_TARGET_ID } });
}

describe("listAllPublicRecipes", () => {
	it("returns only public recipes", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Public",
			isPublic: true,
			tags: [],
		});
		await createRecipe(TEST_USER_ID, {
			title: "Private",
			isPublic: false,
			tags: [],
		});
		const results = await listAllPublicRecipes();
		const titles = results.map((r) => r.title);
		expect(titles).toContain("Public");
		expect(titles).not.toContain("Private");
	});

	it("includes recipes from all users", async () => {
		await upsertOtherUser();
		try {
			await createRecipe(TEST_USER_ID, {
				title: "My Public",
				isPublic: true,
				tags: [],
			});
			await createRecipe(OTHER_USER_ID, {
				title: "Their Public",
				isPublic: true,
				tags: [],
			});
			const results = await listAllPublicRecipes();
			const titles = results.map((r) => r.title);
			expect(titles).toContain("My Public");
			expect(titles).toContain("Their Public");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("includes the author's name and username", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Soup",
			isPublic: true,
			tags: [],
		});
		const results = await listAllPublicRecipes();
		const found = results.find((r) => r.title === "Soup");
		expect(found?.user.name).toBe("Test User");
		expect(found?.user.username).toBe("test-recipes-user");
	});
});

describe("adminForcePrivate", () => {
	it("sets a public recipe to private", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			isPublic: true,
			tags: [],
		});
		await adminForcePrivate(recipe.id);
		const updated = await prisma.recipe.findUnique({
			where: { id: recipe.id },
		});
		expect(updated?.isPublic).toBe(false);
	});

	it("works on a recipe regardless of owner", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Their Recipe",
				isPublic: true,
				tags: [],
			});
			await adminForcePrivate(recipe.id);
			const updated = await prisma.recipe.findUnique({
				where: { id: recipe.id },
			});
			expect(updated?.isPublic).toBe(false);
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("adminDeleteRecipe", () => {
	it("deletes the recipe", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Gone",
			tags: [],
		});
		await adminDeleteRecipe(recipe.id);
		const found = await prisma.recipe.findUnique({ where: { id: recipe.id } });
		expect(found).toBeNull();
	});

	it("calls deleteImageFile when the recipe has an image", async () => {
		const recipe = await prisma.recipe.create({
			data: {
				title: "Recipe",
				userId: TEST_USER_ID,
				imageUrl: "https://cdn.example/img.jpg",
			},
		});
		await adminDeleteRecipe(recipe.id);
		expect(deleteImageFile).toHaveBeenCalledWith("https://cdn.example/img.jpg");
	});

	it("does not call deleteImageFile when the recipe has no image", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "No Image",
			tags: [],
		});
		await adminDeleteRecipe(recipe.id);
		expect(deleteImageFile).not.toHaveBeenCalled();
	});

	it("works on a recipe regardless of owner", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Their Recipe",
				tags: [],
			});
			await adminDeleteRecipe(recipe.id);
			const found = await prisma.recipe.findUnique({
				where: { id: recipe.id },
			});
			expect(found).toBeNull();
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("adminRemoveRecipeImage", () => {
	it("sets imageUrl to null", async () => {
		const recipe = await prisma.recipe.create({
			data: {
				title: "Recipe",
				userId: TEST_USER_ID,
				imageUrl: "https://cdn.example/img.jpg",
			},
		});
		await adminRemoveRecipeImage(recipe.id);
		const updated = await prisma.recipe.findUnique({
			where: { id: recipe.id },
		});
		expect(updated?.imageUrl).toBeNull();
	});

	it("calls deleteImageFile when the recipe has an image", async () => {
		const recipe = await prisma.recipe.create({
			data: {
				title: "Recipe",
				userId: TEST_USER_ID,
				imageUrl: "https://cdn.example/img.jpg",
			},
		});
		await adminRemoveRecipeImage(recipe.id);
		expect(deleteImageFile).toHaveBeenCalledWith("https://cdn.example/img.jpg");
	});

	it("does not call deleteImageFile when there is no image", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "No Image",
			tags: [],
		});
		await adminRemoveRecipeImage(recipe.id);
		expect(deleteImageFile).not.toHaveBeenCalled();
	});

	it("leaves the recipe intact (only the image is removed)", async () => {
		const recipe = await prisma.recipe.create({
			data: {
				title: "Keeper",
				userId: TEST_USER_ID,
				imageUrl: "https://cdn.example/img.jpg",
			},
		});
		await adminRemoveRecipeImage(recipe.id);
		const updated = await prisma.recipe.findUnique({
			where: { id: recipe.id },
		});
		expect(updated).not.toBeNull();
		expect(updated?.title).toBe("Keeper");
	});
});

describe("listAllUsers", () => {
	it("includes the test user", async () => {
		const users = await listAllUsers();
		const found = users.find((u) => u.id === TEST_USER_ID);
		expect(found).toBeDefined();
		expect(found?.name).toBe("Test User");
	});

	it("includes recipe count", async () => {
		await createRecipe(TEST_USER_ID, { title: "A", tags: [] });
		await createRecipe(TEST_USER_ID, { title: "B", tags: [] });
		const users = await listAllUsers();
		const found = users.find((u) => u.id === TEST_USER_ID);
		expect(found?._count.recipes).toBe(2);
	});

	it("includes role and banned fields", async () => {
		const users = await listAllUsers();
		const found = users.find((u) => u.id === TEST_USER_ID);
		expect(found?.role).toBe("user");
		expect(found?.banned).toBe(false);
	});
});

describe("banUser", () => {
	it("marks the user as banned", async () => {
		await upsertBanTarget();
		try {
			await banUser(BAN_TARGET_ID);
			const user = await prisma.user.findUnique({
				where: { id: BAN_TARGET_ID },
			});
			expect(user?.banned).toBe(true);
		} finally {
			await cleanupBanTarget();
		}
	});

	it("deletes all of the user's recipes", async () => {
		await upsertBanTarget();
		try {
			await prisma.recipe.create({
				data: { title: "Recipe A", userId: BAN_TARGET_ID },
			});
			await prisma.recipe.create({
				data: { title: "Recipe B", userId: BAN_TARGET_ID },
			});
			await banUser(BAN_TARGET_ID);
			const remaining = await prisma.recipe.findMany({
				where: { userId: BAN_TARGET_ID },
			});
			expect(remaining).toHaveLength(0);
		} finally {
			await cleanupBanTarget();
		}
	});

	it("calls deleteImageFile for each recipe that has an image", async () => {
		await upsertBanTarget();
		try {
			await prisma.recipe.create({
				data: {
					title: "With Image",
					userId: BAN_TARGET_ID,
					imageUrl: "https://cdn.example/a.jpg",
				},
			});
			await prisma.recipe.create({
				data: { title: "No Image", userId: BAN_TARGET_ID },
			});
			await banUser(BAN_TARGET_ID);
			expect(deleteImageFile).toHaveBeenCalledTimes(1);
			expect(deleteImageFile).toHaveBeenCalledWith("https://cdn.example/a.jpg");
		} finally {
			await cleanupBanTarget();
		}
	});

	it("invalidates all of the user's sessions", async () => {
		await upsertBanTarget();
		try {
			await prisma.session.create({
				data: {
					id: "test-session-ban-1",
					userId: BAN_TARGET_ID,
					token: "token-ban-1",
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});
			await banUser(BAN_TARGET_ID);
			const sessions = await prisma.session.findMany({
				where: { userId: BAN_TARGET_ID },
			});
			expect(sessions).toHaveLength(0);
		} finally {
			await cleanupBanTarget();
		}
	});

	it("stores the ban reason when provided", async () => {
		await upsertBanTarget();
		try {
			await banUser(BAN_TARGET_ID, { banReason: "Offensive content" });
			const user = await prisma.user.findUnique({
				where: { id: BAN_TARGET_ID },
			});
			expect(user?.banReason).toBe("Offensive content");
		} finally {
			await cleanupBanTarget();
		}
	});

	it("stores null for ban reason when omitted", async () => {
		await upsertBanTarget();
		try {
			await banUser(BAN_TARGET_ID);
			const user = await prisma.user.findUnique({
				where: { id: BAN_TARGET_ID },
			});
			expect(user?.banReason).toBeNull();
		} finally {
			await cleanupBanTarget();
		}
	});

	it("stores the ban expiry when provided", async () => {
		await upsertBanTarget();
		try {
			const expiry = new Date("2027-01-01T00:00:00.000Z");
			await banUser(BAN_TARGET_ID, { banExpires: expiry });
			const user = await prisma.user.findUnique({
				where: { id: BAN_TARGET_ID },
			});
			expect(user?.banExpires).toEqual(expiry);
		} finally {
			await cleanupBanTarget();
		}
	});

	it("stores null for ban expiry when omitted", async () => {
		await upsertBanTarget();
		try {
			await banUser(BAN_TARGET_ID);
			const user = await prisma.user.findUnique({
				where: { id: BAN_TARGET_ID },
			});
			expect(user?.banExpires).toBeNull();
		} finally {
			await cleanupBanTarget();
		}
	});

	it("stores both ban reason and expiry together", async () => {
		await upsertBanTarget();
		try {
			const expiry = new Date("2027-06-01T00:00:00.000Z");
			await banUser(BAN_TARGET_ID, { banReason: "Spam", banExpires: expiry });
			const user = await prisma.user.findUnique({
				where: { id: BAN_TARGET_ID },
			});
			expect(user?.banReason).toBe("Spam");
			expect(user?.banExpires).toEqual(expiry);
		} finally {
			await cleanupBanTarget();
		}
	});

	it("does not delete recipes belonging to other users", async () => {
		await upsertBanTarget();
		await upsertOtherUser();
		try {
			await prisma.recipe.create({
				data: { title: "Target Recipe", userId: BAN_TARGET_ID },
			});
			const otherRecipe = await prisma.recipe.create({
				data: { title: "Other Recipe", userId: OTHER_USER_ID },
			});
			await banUser(BAN_TARGET_ID);
			const found = await prisma.recipe.findUnique({
				where: { id: otherRecipe.id },
			});
			expect(found).not.toBeNull();
		} finally {
			await cleanupBanTarget();
			await cleanupOtherUser();
		}
	});
});
