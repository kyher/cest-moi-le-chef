import { describe, expect, it } from "vitest";
import { prisma } from "#/db";
import {
	listLikedRecipes,
	listLikedTagsInUse,
	toggleLike,
} from "#/lib/like-service";
import { createRecipe, setRecipeVisibility } from "#/lib/recipe-service";
import {
	cleanupOtherUser,
	OTHER_USER_ID,
	setupTestUser,
	TEST_USER_ID,
	upsertOtherUser,
} from "./helpers";

setupTestUser();

describe("toggleLike", () => {
	it("creates a like and returns true", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Recipe",
				isPublic: true,
				tags: [],
			});
			const result = await toggleLike(recipe.id, TEST_USER_ID);
			expect(result).toBe(true);
			const like = await prisma.like.findUnique({
				where: {
					userId_recipeId: { userId: TEST_USER_ID, recipeId: recipe.id },
				},
			});
			expect(like).not.toBeNull();
		} finally {
			await cleanupOtherUser();
		}
	});

	it("removes an existing like and returns false", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Recipe",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			const result = await toggleLike(recipe.id, TEST_USER_ID);
			expect(result).toBe(false);
			const like = await prisma.like.findUnique({
				where: {
					userId_recipeId: { userId: TEST_USER_ID, recipeId: recipe.id },
				},
			});
			expect(like).toBeNull();
		} finally {
			await cleanupOtherUser();
		}
	});

	it("throws when the user tries to like their own recipe", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "My Recipe",
			tags: [],
		});
		await expect(toggleLike(recipe.id, TEST_USER_ID)).rejects.toThrow(
			"Cannot like your own recipe",
		);
	});

	it("throws when the recipe does not exist", async () => {
		await expect(toggleLike("non-existent-id", TEST_USER_ID)).rejects.toThrow(
			"Recipe not found",
		);
	});
});

describe("listLikedRecipes", () => {
	it("returns recipes the user has liked", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Liked Recipe",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			const results = await listLikedRecipes(TEST_USER_ID);
			expect(results.map((r) => r.title)).toContain("Liked Recipe");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("does not return recipes the user has not liked", async () => {
		await upsertOtherUser();
		try {
			await createRecipe(OTHER_USER_ID, {
				title: "Not Liked",
				isPublic: true,
				tags: [],
			});
			const results = await listLikedRecipes(TEST_USER_ID);
			expect(results.map((r) => r.title)).not.toContain("Not Liked");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("excludes liked recipes that have become private", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Now Private",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			await setRecipeVisibility(recipe.id, OTHER_USER_ID, false);
			const results = await listLikedRecipes(TEST_USER_ID);
			expect(results.map((r) => r.title)).not.toContain("Now Private");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("filters by tag", async () => {
		await upsertOtherUser();
		try {
			const italian = await createRecipe(OTHER_USER_ID, {
				title: "Italian",
				isPublic: true,
				tags: ["italian"],
			});
			const french = await createRecipe(OTHER_USER_ID, {
				title: "French",
				isPublic: true,
				tags: ["french"],
			});
			await toggleLike(italian.id, TEST_USER_ID);
			await toggleLike(french.id, TEST_USER_ID);
			const results = await listLikedRecipes(TEST_USER_ID, {
				tags: ["italian"],
			});
			expect(results.map((r) => r.title)).toContain("Italian");
			expect(results.map((r) => r.title)).not.toContain("French");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("filters by maxTime", async () => {
		await upsertOtherUser();
		try {
			const quick = await createRecipe(OTHER_USER_ID, {
				title: "Quick",
				isPublic: true,
				totalTime: 15,
				tags: [],
			});
			const slow = await createRecipe(OTHER_USER_ID, {
				title: "Slow",
				isPublic: true,
				totalTime: 90,
				tags: [],
			});
			await toggleLike(quick.id, TEST_USER_ID);
			await toggleLike(slow.id, TEST_USER_ID);
			const results = await listLikedRecipes(TEST_USER_ID, { maxTime: 30 });
			expect(results.map((r) => r.title)).toContain("Quick");
			expect(results.map((r) => r.title)).not.toContain("Slow");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("filters by search query", async () => {
		await upsertOtherUser();
		try {
			const pasta = await createRecipe(OTHER_USER_ID, {
				title: "Creamy Pasta",
				isPublic: true,
				tags: [],
			});
			const burger = await createRecipe(OTHER_USER_ID, {
				title: "Burger",
				isPublic: true,
				tags: [],
			});
			await toggleLike(pasta.id, TEST_USER_ID);
			await toggleLike(burger.id, TEST_USER_ID);
			const results = await listLikedRecipes(TEST_USER_ID, { q: "pasta" });
			expect(results.map((r) => r.title)).toContain("Creamy Pasta");
			expect(results.map((r) => r.title)).not.toContain("Burger");
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("listLikedTagsInUse", () => {
	it("returns tags from the user's visible liked recipes", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Tagged",
				isPublic: true,
				tags: ["italian"],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			const tags = await listLikedTagsInUse(TEST_USER_ID);
			expect(tags.map((t) => t.name)).toContain("italian");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("excludes tags from liked recipes that are currently private", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Now Private",
				isPublic: true,
				tags: ["secret"],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			await setRecipeVisibility(recipe.id, OTHER_USER_ID, false);
			const tags = await listLikedTagsInUse(TEST_USER_ID);
			expect(tags.map((t) => t.name)).not.toContain("secret");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("does not include tags from recipes the user has not liked", async () => {
		await upsertOtherUser();
		try {
			await createRecipe(OTHER_USER_ID, {
				title: "Not Liked",
				isPublic: true,
				tags: ["french"],
			});
			const tags = await listLikedTagsInUse(TEST_USER_ID);
			expect(tags.map((t) => t.name)).not.toContain("french");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("returns tags sorted by name", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Tagged",
				isPublic: true,
				tags: ["zucchini", "apple", "mango"],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			const tags = await listLikedTagsInUse(TEST_USER_ID);
			const names = tags.map((t) => t.name);
			expect(names).toEqual([...names].sort());
		} finally {
			await cleanupOtherUser();
		}
	});
});
