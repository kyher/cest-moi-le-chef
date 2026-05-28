import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "#/db";
import {
	addNote,
	createRecipe,
	findRecipe,
	listRecipes,
	removeNote,
	removeRecipe,
	updateRecipe,
} from "#/lib/recipe-service";

const TEST_USER_ID = "test-user-recipes";

beforeAll(async () => {
	await prisma.user.upsert({
		where: { id: TEST_USER_ID },
		create: {
			id: TEST_USER_ID,
			name: "Test User",
			email: "test-recipes@test.local",
			emailVerified: false,
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
});

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
		await addNote(recipe.id, TEST_USER_ID, "A note");
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
});

describe("notes", () => {
	it("adds a note to a recipe", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		const note = await addNote(recipe.id, TEST_USER_ID, "Needed more salt");
		expect(note.body).toBe("Needed more salt");
		expect(note.recipeId).toBe(recipe.id);
	});

	it("deletes a note", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		const note = await addNote(recipe.id, TEST_USER_ID, "A note");
		await removeNote(note.id, TEST_USER_ID);
		const found = await prisma.note.findUnique({ where: { id: note.id } });
		expect(found).toBeNull();
	});

	it("returns notes in reverse chronological order", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		const first = await addNote(recipe.id, TEST_USER_ID, "First note");
		await new Promise((r) => setTimeout(r, 5));
		const second = await addNote(recipe.id, TEST_USER_ID, "Second note");
		const full = await findRecipe(recipe.id, TEST_USER_ID);
		expect(full?.notes[0].id).toBe(second.id);
		expect(full?.notes[1].id).toBe(first.id);
	});

	it("throws when adding a note to a recipe the user does not own", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		await expect(
			addNote(recipe.id, "other-user-id", "Sneaky note"),
		).rejects.toThrow("Recipe not found");
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
		await addNote(recipe.id, TEST_USER_ID, "Note 1");
		await addNote(recipe.id, TEST_USER_ID, "Note 2");
		const [listed] = await listRecipes(TEST_USER_ID);
		expect(listed._count.notes).toBe(2);
		expect(listed.tags).toHaveLength(2);
	});
});
