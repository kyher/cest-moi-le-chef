import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "#/db";
import {
	addEntry,
	createCollection,
	deleteCollection,
	getCollection,
	listCollections,
	listCollectionsForRecipe,
	removeEntry,
	renameCollection,
} from "#/lib/collection-service";
import { createRecipe, setRecipeVisibility } from "#/lib/recipe-service";
import {
	cleanupOtherUser,
	OTHER_USER_ID,
	setupTestUser,
	TEST_USER_ID,
	upsertOtherUser,
} from "./helpers";

setupTestUser();

beforeEach(async () => {
	await prisma.collection.deleteMany({ where: { userId: TEST_USER_ID } });
});

describe("createCollection", () => {
	it("creates a collection with the given name", async () => {
		const col = await createCollection(TEST_USER_ID, "Italian");
		expect(col.name).toBe("Italian");
		expect(col._count.entries).toBe(0);
	});

	it("trims whitespace from the name", async () => {
		const col = await createCollection(TEST_USER_ID, "  Pasta  ");
		expect(col.name).toBe("Pasta");
	});
});

describe("listCollections", () => {
	it("returns empty array when the user has no collections", async () => {
		const result = await listCollections(TEST_USER_ID);
		expect(result).toEqual([]);
	});

	it("returns all collections ordered by createdAt ascending", async () => {
		await createCollection(TEST_USER_ID, "First");
		await createCollection(TEST_USER_ID, "Second");
		const result = await listCollections(TEST_USER_ID);
		expect(result.map((c) => c.name)).toEqual(["First", "Second"]);
	});

	it("includes the entry count", async () => {
		const col = await createCollection(TEST_USER_ID, "With Recipes");
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		await addEntry(TEST_USER_ID, col.id, recipe.id);
		const [found] = await listCollections(TEST_USER_ID);
		expect(found._count.entries).toBe(1);
	});
});

describe("renameCollection", () => {
	it("renames the collection", async () => {
		const col = await createCollection(TEST_USER_ID, "Old Name");
		await renameCollection(TEST_USER_ID, col.id, "New Name");
		const updated = await prisma.collection.findUniqueOrThrow({
			where: { id: col.id },
		});
		expect(updated.name).toBe("New Name");
	});

	it("trims whitespace from the new name", async () => {
		const col = await createCollection(TEST_USER_ID, "Name");
		await renameCollection(TEST_USER_ID, col.id, "  Trimmed  ");
		const updated = await prisma.collection.findUniqueOrThrow({
			where: { id: col.id },
		});
		expect(updated.name).toBe("Trimmed");
	});

	it("throws when the collection does not belong to the user", async () => {
		await upsertOtherUser();
		try {
			const col = await createCollection(OTHER_USER_ID, "Other's");
			await expect(
				renameCollection(TEST_USER_ID, col.id, "Mine Now"),
			).rejects.toThrow("Not found");
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("deleteCollection", () => {
	it("deletes the collection", async () => {
		const col = await createCollection(TEST_USER_ID, "To Delete");
		await deleteCollection(TEST_USER_ID, col.id);
		const found = await prisma.collection.findUnique({ where: { id: col.id } });
		expect(found).toBeNull();
	});

	it("cascade-deletes entries when the collection is deleted", async () => {
		const col = await createCollection(TEST_USER_ID, "To Delete");
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		await addEntry(TEST_USER_ID, col.id, recipe.id);
		await deleteCollection(TEST_USER_ID, col.id);
		const entries = await prisma.collectionEntry.findMany({
			where: { collectionId: col.id },
		});
		expect(entries).toHaveLength(0);
	});

	it("throws when the collection does not belong to the user", async () => {
		await upsertOtherUser();
		try {
			const col = await createCollection(OTHER_USER_ID, "Other's");
			await expect(deleteCollection(TEST_USER_ID, col.id)).rejects.toThrow(
				"Not found",
			);
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("getCollection", () => {
	it("returns the collection with its entries", async () => {
		const col = await createCollection(TEST_USER_ID, "My Collection");
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		await addEntry(TEST_USER_ID, col.id, recipe.id);
		const found = await getCollection(TEST_USER_ID, col.id);
		expect(found).not.toBeNull();
		expect(found?.entries).toHaveLength(1);
		expect(found?.entries[0].recipe.title).toBe("Pasta");
	});

	it("returns null when the collection does not belong to the user", async () => {
		await upsertOtherUser();
		try {
			const col = await createCollection(OTHER_USER_ID, "Other's");
			const found = await getCollection(TEST_USER_ID, col.id);
			expect(found).toBeNull();
		} finally {
			await cleanupOtherUser();
		}
	});

	it("hides entries whose recipe has been made private by another user", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Now Private",
				isPublic: true,
				tags: [],
			});
			const col = await createCollection(TEST_USER_ID, "My Collection");
			await addEntry(TEST_USER_ID, col.id, recipe.id);
			await setRecipeVisibility(recipe.id, OTHER_USER_ID, false);
			const found = await getCollection(TEST_USER_ID, col.id);
			expect(found?.entries).toHaveLength(0);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("keeps own private recipes visible in the collection", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "My Private",
			isPublic: false,
			tags: [],
		});
		const col = await createCollection(TEST_USER_ID, "My Collection");
		await addEntry(TEST_USER_ID, col.id, recipe.id);
		const found = await getCollection(TEST_USER_ID, col.id);
		expect(found?.entries).toHaveLength(1);
	});
});

describe("addEntry", () => {
	it("adds an own recipe to the collection", async () => {
		const col = await createCollection(TEST_USER_ID, "My Collection");
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		const entry = await addEntry(TEST_USER_ID, col.id, recipe.id);
		expect(entry.recipe.title).toBe("Pasta");
	});

	it("adds an own private recipe to the collection", async () => {
		const col = await createCollection(TEST_USER_ID, "My Collection");
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Private Pasta",
			isPublic: false,
			tags: [],
		});
		const entry = await addEntry(TEST_USER_ID, col.id, recipe.id);
		expect(entry.recipe.title).toBe("Private Pasta");
	});

	it("adds a public recipe from another user without requiring a Like", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Pasta",
				isPublic: true,
				tags: [],
			});
			const col = await createCollection(TEST_USER_ID, "My Collection");
			const entry = await addEntry(TEST_USER_ID, col.id, recipe.id);
			expect(entry.recipe.title).toBe("Public Pasta");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("is a no-op when the recipe is already in the collection", async () => {
		const col = await createCollection(TEST_USER_ID, "My Collection");
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		await addEntry(TEST_USER_ID, col.id, recipe.id);
		await expect(
			addEntry(TEST_USER_ID, col.id, recipe.id),
		).resolves.not.toThrow();
		const entries = await prisma.collectionEntry.findMany({
			where: { collectionId: col.id },
		});
		expect(entries).toHaveLength(1);
	});

	it("throws when the recipe does not exist", async () => {
		const col = await createCollection(TEST_USER_ID, "My Collection");
		await expect(
			addEntry(TEST_USER_ID, col.id, "non-existent-id"),
		).rejects.toThrow("Recipe not found");
	});

	it("throws when the recipe is private and belongs to another user", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Private",
				isPublic: false,
				tags: [],
			});
			const col = await createCollection(TEST_USER_ID, "My Collection");
			await expect(addEntry(TEST_USER_ID, col.id, recipe.id)).rejects.toThrow(
				"Recipe not accessible",
			);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("throws when the collection does not belong to the user", async () => {
		await upsertOtherUser();
		try {
			const col = await createCollection(OTHER_USER_ID, "Other's");
			const recipe = await createRecipe(TEST_USER_ID, {
				title: "Pasta",
				tags: [],
			});
			await expect(addEntry(TEST_USER_ID, col.id, recipe.id)).rejects.toThrow(
				"Not found",
			);
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("removeEntry", () => {
	it("removes a recipe from the collection", async () => {
		const col = await createCollection(TEST_USER_ID, "My Collection");
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		await addEntry(TEST_USER_ID, col.id, recipe.id);
		await removeEntry(TEST_USER_ID, col.id, recipe.id);
		const entries = await prisma.collectionEntry.findMany({
			where: { collectionId: col.id },
		});
		expect(entries).toHaveLength(0);
	});

	it("throws when the collection does not belong to the user", async () => {
		await upsertOtherUser();
		try {
			const col = await createCollection(OTHER_USER_ID, "Other's");
			const recipe = await createRecipe(TEST_USER_ID, {
				title: "Pasta",
				tags: [],
			});
			await expect(
				removeEntry(TEST_USER_ID, col.id, recipe.id),
			).rejects.toThrow("Not found");
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("listCollectionsForRecipe", () => {
	it("returns empty array when the user has no collections", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		const result = await listCollectionsForRecipe(TEST_USER_ID, recipe.id);
		expect(result).toEqual([]);
	});

	it("marks collections that contain the recipe with hasRecipe: true", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		const col1 = await createCollection(TEST_USER_ID, "Has It");
		const col2 = await createCollection(TEST_USER_ID, "Does Not");
		await addEntry(TEST_USER_ID, col1.id, recipe.id);
		const result = await listCollectionsForRecipe(TEST_USER_ID, recipe.id);
		expect(result.find((c) => c.id === col1.id)?.hasRecipe).toBe(true);
		expect(result.find((c) => c.id === col2.id)?.hasRecipe).toBe(false);
	});

	it("returns all collections even when none contain the recipe", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		await createCollection(TEST_USER_ID, "Empty A");
		await createCollection(TEST_USER_ID, "Empty B");
		const result = await listCollectionsForRecipe(TEST_USER_ID, recipe.id);
		expect(result).toHaveLength(2);
		expect(result.every((c) => !c.hasRecipe)).toBe(true);
	});
});
