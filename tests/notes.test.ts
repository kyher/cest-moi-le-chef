import { describe, expect, it } from "vitest";
import { prisma } from "#/db";
import { addNote, removeNote } from "#/lib/note-service";
import { createRecipe, findRecipe } from "#/lib/recipe-service";
import {
	cleanupOtherUser,
	OTHER_USER_ID,
	setupTestUser,
	TEST_USER_ID,
	upsertOtherUser,
} from "./helpers";

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

	it("throws when adding a note to a private recipe the user does not own", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: [],
		});
		await expect(
			addNote(recipe.id, "other-user-id", "Sneaky note"),
		).rejects.toThrow("Recipe not found");
	});

	it("adds a note to another user's public recipe", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Recipe",
				isPublic: true,
				tags: [],
			});
			const note = await addNote(
				recipe.id,
				TEST_USER_ID,
				"Tried this last night",
			);
			expect(note.recipeId).toBe(recipe.id);
			expect(note.userId).toBe(TEST_USER_ID);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("cannot delete another user's note", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Recipe",
				isPublic: true,
				tags: [],
			});
			const note = await addNote(recipe.id, TEST_USER_ID, "My note");
			await expect(removeNote(note.id, OTHER_USER_ID)).rejects.toThrow(
				"Note not found",
			);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("findRecipe returns the viewer's own notes on another user's recipe", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Public Recipe",
				isPublic: true,
				tags: [],
			});
			await addNote(recipe.id, TEST_USER_ID, "My personal note");
			const result = await findRecipe(recipe.id, TEST_USER_ID);
			expect(result?.notes).toHaveLength(1);
			expect(result?.notes[0].body).toBe("My personal note");
		} finally {
			await cleanupOtherUser();
		}
	});
});
