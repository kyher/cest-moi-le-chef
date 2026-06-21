import { describe, expect, it, vi } from "vitest";
import { prisma } from "#/db";
import { toggleLike } from "#/lib/like-service";
import {
	createRecipe,
	findRecipe,
	listPublicRecipes,
	listRecipes,
	removeRecipe,
	removeRecipeImage,
	setRecipeVisibility,
	updateRecipe,
} from "#/lib/recipe-service";
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

describe("createRecipe", () => {
	it("creates a recipe with a title only", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		expect(recipe.title).toBe("Pasta");
		expect(recipe.ingredients).toBeNull();
		expect(recipe.method).toBeNull();
		expect(recipe.userId).toBe(TEST_USER_ID);
	});

	it("creates a recipe with all fields", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Risotto",
			ingredients: "200g rice\n500ml stock",
			method: "Add rice, stir constantly",
			tags: ["main", "italian"],
		});
		const full = await findRecipe(recipe.id, TEST_USER_ID);
		expect(full?.title).toBe("Risotto");
		expect(full?.ingredients).toBe("200g rice\n500ml stock");
		expect(full?.method).toBe("Add rice, stir constantly");
		expect(full?.tags.map(({ tag }) => tag.name).sort()).toEqual([
			"italian",
			"main",
		]);
	});

	it("creates a recipe with totalTime", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Soup",
			totalTime: 90,
			tags: [],
		});
		expect(recipe.totalTime).toBe(90);
	});

	it("stores totalTime as null when omitted", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Soup",
			tags: [],
		});
		expect(recipe.totalTime).toBeNull();
	});

	it("creates a recipe with servings", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Soup",
			servings: 4,
			tags: [],
		});
		expect(recipe.servings).toBe(4);
	});

	it("stores servings as null when omitted", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Soup",
			tags: [],
		});
		expect(recipe.servings).toBeNull();
	});

	it("normalises tags to lowercase", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: ["MAIN", "Italian"],
		});
		const full = await findRecipe(recipe.id, TEST_USER_ID);
		expect(full?.tags.map(({ tag }) => tag.name).sort()).toEqual([
			"italian",
			"main",
		]);
	});

	it("reuses existing tags across recipes rather than creating duplicates", async () => {
		await createRecipe(TEST_USER_ID, { title: "Recipe A", tags: ["main"] });
		await createRecipe(TEST_USER_ID, { title: "Recipe B", tags: ["main"] });
		const tags = await prisma.tag.findMany({
			where: { name: "main", userId: TEST_USER_ID },
		});
		expect(tags).toHaveLength(1);
	});
});

describe("updateRecipe", () => {
	it("updates title and optional fields", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Old Title",
			tags: [],
		});
		await updateRecipe(recipe.id, TEST_USER_ID, {
			title: "New Title",
			ingredients: "2 eggs",
			method: "Fry them",
			tags: [],
		});
		const updated = await findRecipe(recipe.id, TEST_USER_ID);
		expect(updated?.title).toBe("New Title");
		expect(updated?.ingredients).toBe("2 eggs");
		expect(updated?.method).toBe("Fry them");
	});

	it("replaces all tags on update", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: ["starter", "french"],
		});
		await updateRecipe(recipe.id, TEST_USER_ID, {
			title: "Recipe",
			tags: ["main"],
		});
		const updated = await findRecipe(recipe.id, TEST_USER_ID);
		expect(updated?.tags.map(({ tag }) => tag.name)).toEqual(["main"]);
	});

	it("removes all tags when updated with empty tag list", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: ["main"],
		});
		await updateRecipe(recipe.id, TEST_USER_ID, { title: "Recipe", tags: [] });
		const updated = await findRecipe(recipe.id, TEST_USER_ID);
		expect(updated?.tags).toHaveLength(0);
	});

	it("updates totalTime", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			totalTime: 30,
			tags: [],
		});
		await updateRecipe(recipe.id, TEST_USER_ID, {
			title: "Recipe",
			totalTime: 60,
			tags: [],
		});
		const updated = await findRecipe(recipe.id, TEST_USER_ID);
		expect(updated?.totalTime).toBe(60);
	});

	it("clears totalTime when omitted", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			totalTime: 30,
			tags: [],
		});
		await updateRecipe(recipe.id, TEST_USER_ID, { title: "Recipe", tags: [] });
		const updated = await findRecipe(recipe.id, TEST_USER_ID);
		expect(updated?.totalTime).toBeNull();
	});

	it("updates servings", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			servings: 2,
			tags: [],
		});
		await updateRecipe(recipe.id, TEST_USER_ID, {
			title: "Recipe",
			servings: 6,
			tags: [],
		});
		const updated = await findRecipe(recipe.id, TEST_USER_ID);
		expect(updated?.servings).toBe(6);
	});

	it("clears servings when omitted", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			servings: 4,
			tags: [],
		});
		await updateRecipe(recipe.id, TEST_USER_ID, { title: "Recipe", tags: [] });
		const updated = await findRecipe(recipe.id, TEST_USER_ID);
		expect(updated?.servings).toBeNull();
	});

	it("clears an optional field when passed an empty string", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			ingredients: "2 eggs",
			tags: [],
		});
		await updateRecipe(recipe.id, TEST_USER_ID, {
			title: "Recipe",
			ingredients: "",
			tags: [],
		});
		const updated = await findRecipe(recipe.id, TEST_USER_ID);
		expect(updated?.ingredients).toBeNull();
	});
});

describe("removeRecipe", () => {
	it("deletes the recipe", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "To Delete",
			tags: [],
		});
		await removeRecipe(recipe.id, TEST_USER_ID);
		const found = await findRecipe(recipe.id, TEST_USER_ID);
		expect(found).toBeNull();
	});

	it("cascades deletion to notes", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		await prisma.note.create({
			data: { body: "A note", recipeId: recipe.id, userId: TEST_USER_ID },
		});
		await removeRecipe(recipe.id, TEST_USER_ID);
		const notes = await prisma.note.findMany({
			where: { recipeId: recipe.id },
		});
		expect(notes).toHaveLength(0);
	});

	it("cannot be found by another user after deletion", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		await removeRecipe(recipe.id, TEST_USER_ID);
		const found = await prisma.recipe.findUnique({ where: { id: recipe.id } });
		expect(found).toBeNull();
	});

	it("deletes the image file when the recipe has a cover image", async () => {
		const recipe = await prisma.recipe.create({
			data: {
				title: "Recipe",
				userId: TEST_USER_ID,
				imageUrl: "/uploads/abc.jpg",
			},
		});
		await removeRecipe(recipe.id, TEST_USER_ID);
		expect(deleteImageFile).toHaveBeenCalledWith("/uploads/abc.jpg");
	});

	it("does not call deleteImageFile when there is no cover image", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		await removeRecipe(recipe.id, TEST_USER_ID);
		expect(deleteImageFile).not.toHaveBeenCalled();
	});
});

describe("removeRecipeImage", () => {
	it("sets imageUrl to null in the database", async () => {
		const recipe = await prisma.recipe.create({
			data: {
				title: "Recipe",
				userId: TEST_USER_ID,
				imageUrl: "/uploads/abc.jpg",
			},
		});
		await removeRecipeImage(recipe.id, TEST_USER_ID);
		const updated = await prisma.recipe.findUnique({
			where: { id: recipe.id },
		});
		expect(updated?.imageUrl).toBeNull();
	});

	it("deletes the image file from disk", async () => {
		const recipe = await prisma.recipe.create({
			data: {
				title: "Recipe",
				userId: TEST_USER_ID,
				imageUrl: "/uploads/abc.jpg",
			},
		});
		await removeRecipeImage(recipe.id, TEST_USER_ID);
		expect(deleteImageFile).toHaveBeenCalledWith("/uploads/abc.jpg");
	});

	it("succeeds without calling deleteImageFile when there is no image", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		await removeRecipeImage(recipe.id, TEST_USER_ID);
		expect(deleteImageFile).not.toHaveBeenCalled();
		const updated = await prisma.recipe.findUnique({
			where: { id: recipe.id },
		});
		expect(updated?.imageUrl).toBeNull();
	});

	it("throws when the recipe does not belong to the user", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		await expect(removeRecipeImage(recipe.id, "other-user")).rejects.toThrow(
			"Recipe not found",
		);
	});
});

describe("isPublic on createRecipe", () => {
	it("defaults to false when isPublic is not specified", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Private by Default",
			tags: [],
		});
		expect(recipe.isPublic).toBe(false);
	});

	it("can be set to true at creation", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Public Recipe",
			isPublic: true,
			tags: [],
		});
		expect(recipe.isPublic).toBe(true);
	});
});

describe("setRecipeVisibility", () => {
	it("makes a private recipe public", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		await setRecipeVisibility(recipe.id, TEST_USER_ID, true);
		const updated = await prisma.recipe.findUnique({
			where: { id: recipe.id },
		});
		expect(updated?.isPublic).toBe(true);
	});

	it("makes a public recipe private", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			isPublic: true,
			tags: [],
		});
		await setRecipeVisibility(recipe.id, TEST_USER_ID, false);
		const updated = await prisma.recipe.findUnique({
			where: { id: recipe.id },
		});
		expect(updated?.isPublic).toBe(false);
	});

	it("does not affect a recipe owned by another user", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Their Recipe",
				isPublic: false,
				tags: [],
			});
			await expect(
				setRecipeVisibility(recipe.id, TEST_USER_ID, true),
			).rejects.toThrow();
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("listRecipes", () => {
	it("only returns recipes belonging to the requesting user", async () => {
		const OTHER_ID = "test-user-other-isolation";
		await prisma.user.upsert({
			where: { id: OTHER_ID },
			create: {
				id: OTHER_ID,
				name: "Other",
				email: "other-isolation@test.local",
				emailVerified: false,
				username: "other-isolation",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			update: {},
		});
		try {
			await createRecipe(TEST_USER_ID, { title: "My Recipe", tags: [] });
			await createRecipe(OTHER_ID, { title: "Their Recipe", tags: [] });
			const recipes = await listRecipes(TEST_USER_ID);
			expect(recipes.every((r) => r.userId === TEST_USER_ID)).toBe(true);
			expect(recipes.map((r) => r.title)).toContain("My Recipe");
			expect(recipes.map((r) => r.title)).not.toContain("Their Recipe");
		} finally {
			await prisma.user.delete({ where: { id: OTHER_ID } });
		}
	});

	it("includes tag and note count on each recipe", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: ["main", "quick"],
		});
		await prisma.note.create({
			data: { body: "Note 1", recipeId: recipe.id, userId: TEST_USER_ID },
		});
		await prisma.note.create({
			data: { body: "Note 2", recipeId: recipe.id, userId: TEST_USER_ID },
		});
		const [listed] = await listRecipes(TEST_USER_ID);
		expect(listed._count.notes).toBe(2);
		expect(listed.tags).toHaveLength(2);
	});

	describe("tag filter", () => {
		it("returns recipes that have the specified tag", async () => {
			await createRecipe(TEST_USER_ID, { title: "Pasta", tags: ["italian"] });
			await createRecipe(TEST_USER_ID, { title: "Burger", tags: ["american"] });
			const results = await listRecipes(TEST_USER_ID, { tags: ["italian"] });
			expect(results.map((r) => r.title)).toEqual(["Pasta"]);
		});

		it("excludes recipes that do not have the specified tag", async () => {
			await createRecipe(TEST_USER_ID, { title: "Pasta", tags: ["italian"] });
			await createRecipe(TEST_USER_ID, { title: "Soup", tags: [] });
			const results = await listRecipes(TEST_USER_ID, { tags: ["italian"] });
			expect(results.map((r) => r.title)).not.toContain("Soup");
		});

		it("applies AND logic — requires all specified tags to match", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Quick Italian",
				tags: ["italian", "quick"],
			});
			await createRecipe(TEST_USER_ID, {
				title: "Slow Italian",
				tags: ["italian"],
			});
			await createRecipe(TEST_USER_ID, {
				title: "Quick Other",
				tags: ["quick"],
			});
			const results = await listRecipes(TEST_USER_ID, {
				tags: ["italian", "quick"],
			});
			expect(results.map((r) => r.title)).toEqual(["Quick Italian"]);
		});
	});

	describe("maxTime filter", () => {
		it("returns recipes at or under the time threshold", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Quick",
				totalTime: 20,
				tags: [],
			});
			await createRecipe(TEST_USER_ID, {
				title: "Exact",
				totalTime: 30,
				tags: [],
			});
			const results = await listRecipes(TEST_USER_ID, { maxTime: 30 });
			expect(results.map((r) => r.title).sort()).toEqual(["Exact", "Quick"]);
		});

		it("excludes recipes over the time threshold", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Slow",
				totalTime: 90,
				tags: [],
			});
			const results = await listRecipes(TEST_USER_ID, { maxTime: 30 });
			expect(results.map((r) => r.title)).not.toContain("Slow");
		});

		it("excludes recipes with no total time when filter is active", async () => {
			await createRecipe(TEST_USER_ID, { title: "No Time", tags: [] });
			const results = await listRecipes(TEST_USER_ID, { maxTime: 30 });
			expect(results.map((r) => r.title)).not.toContain("No Time");
		});
	});

	describe("search filter (q)", () => {
		it("returns recipes whose title contains the query", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Creamy Pasta Bake",
				tags: [],
			});
			await createRecipe(TEST_USER_ID, { title: "Burger", tags: [] });
			const results = await listRecipes(TEST_USER_ID, { q: "pasta" });
			expect(results.map((r) => r.title)).toEqual(["Creamy Pasta Bake"]);
		});

		it("is case-insensitive", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Creamy Pasta Bake",
				tags: [],
			});
			const lower = await listRecipes(TEST_USER_ID, { q: "pasta" });
			const upper = await listRecipes(TEST_USER_ID, { q: "PASTA" });
			const mixed = await listRecipes(TEST_USER_ID, { q: "Creamy" });
			expect(lower).toHaveLength(1);
			expect(upper).toHaveLength(1);
			expect(mixed).toHaveLength(1);
		});

		it("matches a substring anywhere in the title", async () => {
			await createRecipe(TEST_USER_ID, { title: "Tomato Soup", tags: [] });
			const results = await listRecipes(TEST_USER_ID, { q: "ato" });
			expect(results.map((r) => r.title)).toContain("Tomato Soup");
		});

		it("returns no results when nothing matches", async () => {
			await createRecipe(TEST_USER_ID, { title: "Risotto", tags: [] });
			const results = await listRecipes(TEST_USER_ID, { q: "xyz" });
			expect(results).toHaveLength(0);
		});

		it("excludes recipes that do not match the query", async () => {
			await createRecipe(TEST_USER_ID, { title: "Pasta", tags: [] });
			await createRecipe(TEST_USER_ID, { title: "Salad", tags: [] });
			const results = await listRecipes(TEST_USER_ID, { q: "pasta" });
			expect(results.map((r) => r.title)).not.toContain("Salad");
		});
	});

	describe("visibility filter", () => {
		it("returns only public recipes when visibility is 'public'", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Public One",
				tags: [],
				isPublic: true,
			});
			await createRecipe(TEST_USER_ID, { title: "Private One", tags: [] });
			const results = await listRecipes(TEST_USER_ID, { visibility: "public" });
			expect(results.map((r) => r.title)).toEqual(["Public One"]);
		});

		it("returns only private recipes when visibility is 'private'", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Public One",
				tags: [],
				isPublic: true,
			});
			await createRecipe(TEST_USER_ID, { title: "Private One", tags: [] });
			const results = await listRecipes(TEST_USER_ID, {
				visibility: "private",
			});
			expect(results.map((r) => r.title)).toEqual(["Private One"]);
		});

		it("returns all recipes when no visibility filter is set", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Public One",
				tags: [],
				isPublic: true,
			});
			await createRecipe(TEST_USER_ID, { title: "Private One", tags: [] });
			const results = await listRecipes(TEST_USER_ID);
			expect(results).toHaveLength(2);
		});

		it("returns no results when no recipes match the visibility", async () => {
			await createRecipe(TEST_USER_ID, { title: "Private Only", tags: [] });
			const results = await listRecipes(TEST_USER_ID, { visibility: "public" });
			expect(results).toHaveLength(0);
		});

		it("combines visibility with another filter", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Public Italian",
				tags: ["italian"],
				isPublic: true,
			});
			await createRecipe(TEST_USER_ID, {
				title: "Private Italian",
				tags: ["italian"],
			});
			await createRecipe(TEST_USER_ID, {
				title: "Public Other",
				tags: ["other"],
				isPublic: true,
			});
			const results = await listRecipes(TEST_USER_ID, {
				visibility: "public",
				tags: ["italian"],
			});
			expect(results.map((r) => r.title)).toEqual(["Public Italian"]);
		});
	});

	describe("combined filters", () => {
		it("applies tag and maxTime filters together", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Quick Italian",
				tags: ["italian"],
				totalTime: 20,
			});
			await createRecipe(TEST_USER_ID, {
				title: "Slow Italian",
				tags: ["italian"],
				totalTime: 90,
			});
			await createRecipe(TEST_USER_ID, {
				title: "Quick Other",
				tags: ["other"],
				totalTime: 20,
			});
			const results = await listRecipes(TEST_USER_ID, {
				tags: ["italian"],
				maxTime: 30,
			});
			expect(results.map((r) => r.title)).toEqual(["Quick Italian"]);
		});

		it("applies search and tag filters together", async () => {
			await createRecipe(TEST_USER_ID, {
				title: "Italian Pasta",
				tags: ["italian"],
			});
			await createRecipe(TEST_USER_ID, {
				title: "Italian Risotto",
				tags: ["italian"],
			});
			await createRecipe(TEST_USER_ID, {
				title: "French Pasta",
				tags: ["french"],
			});
			const results = await listRecipes(TEST_USER_ID, {
				q: "pasta",
				tags: ["italian"],
			});
			expect(results.map((r) => r.title)).toEqual(["Italian Pasta"]);
		});
	});
});

describe("findRecipe — visibility access control", () => {
	it("owner can view their own private recipe", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Private",
			tags: [],
		});
		const result = await findRecipe(recipe.id, TEST_USER_ID);
		expect(result).not.toBeNull();
		expect(result?.title).toBe("Private");
	});

	it("owner can view their own public recipe", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Public",
			isPublic: true,
			tags: [],
		});
		const result = await findRecipe(recipe.id, TEST_USER_ID);
		expect(result).not.toBeNull();
	});

	it("owner result has isOwner: true", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		const result = await findRecipe(recipe.id, TEST_USER_ID);
		expect(result?.isOwner).toBe(true);
	});

	it("owner result includes notes", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		await prisma.note.create({
			data: { body: "My note", recipeId: recipe.id, userId: TEST_USER_ID },
		});
		const result = await findRecipe(recipe.id, TEST_USER_ID);
		expect(result?.notes).toHaveLength(1);
	});

	it("non-owner can view a public recipe", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Recipe",
				isPublic: true,
				tags: [],
			});
			const result = await findRecipe(recipe.id, TEST_USER_ID);
			expect(result).not.toBeNull();
			expect(result?.title).toBe("Public Recipe");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("non-owner result has isOwner: false", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Recipe",
				isPublic: true,
				tags: [],
			});
			const result = await findRecipe(recipe.id, TEST_USER_ID);
			expect(result?.isOwner).toBe(false);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("non-owner result has empty notes", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Recipe",
				isPublic: true,
				tags: [],
			});
			await prisma.note.create({
				data: {
					body: "Secret note",
					recipeId: recipe.id,
					userId: OTHER_USER_ID,
				},
			});
			const result = await findRecipe(recipe.id, TEST_USER_ID);
			expect(result?.notes).toHaveLength(0);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("non-owner cannot view a private recipe — returns null", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Private Recipe",
				isPublic: false,
				tags: [],
			});
			const result = await findRecipe(recipe.id, TEST_USER_ID);
			expect(result).toBeNull();
		} finally {
			await cleanupOtherUser();
		}
	});

	it("unauthenticated viewer can see a public recipe", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Public",
			isPublic: true,
			tags: [],
		});
		const result = await findRecipe(recipe.id, null);
		expect(result).not.toBeNull();
		expect(result?.isOwner).toBe(false);
	});

	it("unauthenticated viewer cannot see a private recipe — returns null", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Private",
			tags: [],
		});
		const result = await findRecipe(recipe.id, null);
		expect(result).toBeNull();
	});

	it("result includes the author's name", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Public",
			isPublic: true,
			tags: [],
		});
		const result = await findRecipe(recipe.id, null);
		expect(result?.user.name).toBe("Test User");
	});
});

describe("findRecipe — like fields", () => {
	it("owner sees viewerHasLiked as null", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		const result = await findRecipe(recipe.id, TEST_USER_ID);
		expect(result?.viewerHasLiked).toBeNull();
	});

	it("non-owner who has liked sees viewerHasLiked as true", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Recipe",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			const result = await findRecipe(recipe.id, TEST_USER_ID);
			expect(result?.viewerHasLiked).toBe(true);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("non-owner who has not liked sees viewerHasLiked as false", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Recipe",
				isPublic: true,
				tags: [],
			});
			const result = await findRecipe(recipe.id, TEST_USER_ID);
			expect(result?.viewerHasLiked).toBe(false);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("unauthenticated viewer sees viewerHasLiked as null", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Public",
			isPublic: true,
			tags: [],
		});
		const result = await findRecipe(recipe.id, null);
		expect(result?.viewerHasLiked).toBeNull();
	});

	it("returns the correct likeCount", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Recipe",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			const result = await findRecipe(recipe.id, TEST_USER_ID);
			expect(result?.likeCount).toBe(1);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("likeCount is 0 when no one has liked", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Recipe",
				isPublic: true,
				tags: [],
			});
			const result = await findRecipe(recipe.id, TEST_USER_ID);
			expect(result?.likeCount).toBe(0);
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("listPublicRecipes", () => {
	it("only returns public recipes", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Private",
			isPublic: false,
			tags: [],
		});
		await createRecipe(TEST_USER_ID, {
			title: "Public",
			isPublic: true,
			tags: [],
		});
		const results = await listPublicRecipes();
		expect(results.map((r) => r.title)).toContain("Public");
		expect(results.map((r) => r.title)).not.toContain("Private");
	});

	it("includes recipes from multiple users", async () => {
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
			const results = await listPublicRecipes();
			const titles = results.map((r) => r.title);
			expect(titles).toContain("My Public");
			expect(titles).toContain("Their Public");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("includes the author's name on each recipe", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Public",
			isPublic: true,
			tags: [],
		});
		const [result] = await listPublicRecipes();
		expect(result.user.name).toBe("Test User");
	});

	it("filters by tag", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Italian",
			isPublic: true,
			tags: ["italian"],
		});
		await createRecipe(TEST_USER_ID, {
			title: "French",
			isPublic: true,
			tags: ["french"],
		});
		const results = await listPublicRecipes({ tags: ["italian"] });
		expect(results.map((r) => r.title)).toEqual(["Italian"]);
	});

	it("filters by maxTime", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Quick",
			isPublic: true,
			totalTime: 15,
			tags: [],
		});
		await createRecipe(TEST_USER_ID, {
			title: "Slow",
			isPublic: true,
			totalTime: 90,
			tags: [],
		});
		const results = await listPublicRecipes({ maxTime: 30 });
		expect(results.map((r) => r.title)).toContain("Quick");
		expect(results.map((r) => r.title)).not.toContain("Slow");
	});

	it("filters by search query", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Creamy Pasta",
			isPublic: true,
			tags: [],
		});
		await createRecipe(TEST_USER_ID, {
			title: "Burger",
			isPublic: true,
			tags: [],
		});
		const results = await listPublicRecipes({ q: "pasta" });
		expect(results.map((r) => r.title)).toEqual(["Creamy Pasta"]);
	});
});

describe("listPublicRecipes — like count", () => {
	it("includes the like count on each recipe", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Popular",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			const results = await listPublicRecipes();
			const found = results.find((r) => r.id === recipe.id);
			expect(found?._count.likes).toBe(1);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("viewer's like is reflected when viewerId is provided", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Liked",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			const results = await listPublicRecipes({}, TEST_USER_ID);
			const found = results.find((r) => r.id === recipe.id);
			expect(found?.likes).toHaveLength(1);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("likes is empty when the viewer has not liked the recipe", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Not Liked",
				isPublic: true,
				tags: [],
			});
			const results = await listPublicRecipes({}, TEST_USER_ID);
			const found = results.find((r) => r.id === recipe.id);
			expect(found?.likes).toHaveLength(0);
		} finally {
			await cleanupOtherUser();
		}
	});
});
