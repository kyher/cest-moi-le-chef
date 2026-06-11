import { describe, expect, it } from "vitest";
import { prisma } from "#/db";
import { addNote, removeNote } from "#/lib/note-service";
import { createRecipe, findRecipe } from "#/lib/recipe-service";
import { setupTestUser, TEST_USER_ID } from "./helpers";

setupTestUser();

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
