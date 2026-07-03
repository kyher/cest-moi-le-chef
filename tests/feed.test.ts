import { describe, expect, it } from "vitest";
import { prisma } from "#/db";
import { countFollowing, toggleFollow } from "#/lib/follow-service";
import {
	createRecipe,
	listFeedRecipes,
	setRecipeVisibility,
} from "#/lib/recipe-service";
import {
	cleanupOtherUser,
	OTHER_USER_ID,
	setupTestUser,
	TEST_USER_ID,
	upsertOtherUser,
} from "./helpers";

const THIRD_USER_ID = "test-user-third";

async function upsertThirdUser() {
	await prisma.user.upsert({
		where: { id: THIRD_USER_ID },
		create: {
			id: THIRD_USER_ID,
			name: "Third Chef",
			email: "third-chef@test.local",
			emailVerified: false,
			username: "third-chef",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		update: {},
	});
}

async function cleanupThirdUser() {
	await prisma.user.deleteMany({ where: { id: THIRD_USER_ID } });
}

setupTestUser();

describe("listFeedRecipes", () => {
	it("returns public recipes from followed users", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Followed Recipe",
				isPublic: true,
				tags: [],
			});
			await toggleFollow(TEST_USER_ID, OTHER_USER_ID);
			const results = await listFeedRecipes(TEST_USER_ID);
			expect(results.map((r) => r.id)).toContain(recipe.id);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("excludes recipes from users the viewer does not follow", async () => {
		await upsertOtherUser();
		try {
			await createRecipe(OTHER_USER_ID, {
				title: "Not Followed",
				isPublic: true,
				tags: [],
			});
			const results = await listFeedRecipes(TEST_USER_ID);
			expect(results.map((r) => r.title)).not.toContain("Not Followed");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("excludes the viewer's own recipes, since a user cannot follow themselves", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "My Own Recipe",
			isPublic: true,
			tags: [],
		});
		const results = await listFeedRecipes(TEST_USER_ID);
		expect(results.map((r) => r.title)).not.toContain("My Own Recipe");
	});

	it("excludes private recipes from followed users", async () => {
		await upsertOtherUser();
		try {
			await createRecipe(OTHER_USER_ID, {
				title: "Private Recipe",
				isPublic: false,
				tags: [],
			});
			await toggleFollow(TEST_USER_ID, OTHER_USER_ID);
			const results = await listFeedRecipes(TEST_USER_ID);
			expect(results.map((r) => r.title)).not.toContain("Private Recipe");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("excludes a followed recipe that becomes private after being followed", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Now Private",
				isPublic: true,
				tags: [],
			});
			await toggleFollow(TEST_USER_ID, OTHER_USER_ID);
			await setRecipeVisibility(recipe.id, OTHER_USER_ID, false);
			const results = await listFeedRecipes(TEST_USER_ID);
			expect(results.map((r) => r.title)).not.toContain("Now Private");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("orders recipes newest-first by createdAt across multiple followed users", async () => {
		await upsertOtherUser();
		await upsertThirdUser();
		try {
			const older = await createRecipe(OTHER_USER_ID, {
				title: "Older",
				isPublic: true,
				tags: [],
			});
			await prisma.recipe.update({
				where: { id: older.id },
				data: { createdAt: new Date("2020-01-01") },
			});
			const newer = await createRecipe(THIRD_USER_ID, {
				title: "Newer",
				isPublic: true,
				tags: [],
			});
			await prisma.recipe.update({
				where: { id: newer.id },
				data: { createdAt: new Date("2024-01-01") },
			});
			await toggleFollow(TEST_USER_ID, OTHER_USER_ID);
			await toggleFollow(TEST_USER_ID, THIRD_USER_ID);
			const results = await listFeedRecipes(TEST_USER_ID);
			expect(results.map((r) => r.title)).toEqual(["Newer", "Older"]);
		} finally {
			await cleanupOtherUser();
			await cleanupThirdUser();
		}
	});
});

describe("countFollowing", () => {
	it("returns 0 when following no one", async () => {
		expect(await countFollowing(TEST_USER_ID)).toBe(0);
	});

	it("returns the number of users followed", async () => {
		await upsertOtherUser();
		try {
			await toggleFollow(TEST_USER_ID, OTHER_USER_ID);
			expect(await countFollowing(TEST_USER_ID)).toBe(1);
		} finally {
			await cleanupOtherUser();
		}
	});
});
