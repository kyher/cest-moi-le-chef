import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "#/db";
import { toggleLike } from "#/lib/like-service";
import { createRecipe, setRecipeVisibility } from "#/lib/recipe-service";
import {
	addEntry,
	clearPlan,
	getPlan,
	getRecipeOptions,
	removeEntry,
	updateEntries,
} from "#/lib/weekly-plan-service";
import {
	cleanupOtherUser,
	OTHER_USER_ID,
	setupTestUser,
	TEST_USER_ID,
	upsertOtherUser,
} from "./helpers";

setupTestUser();

beforeEach(async () => {
	await prisma.weeklyPlan.deleteMany({ where: { userId: TEST_USER_ID } });
});

describe("getPlan", () => {
	it("returns an empty array when the user has no entries", async () => {
		const entries = await getPlan(TEST_USER_ID);
		expect(entries).toEqual([]);
	});

	it("returns entries for the user's plan", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Pasta",
			tags: [],
		});
		await addEntry(TEST_USER_ID, recipe.id, "MONDAY");
		const entries = await getPlan(TEST_USER_ID);
		expect(entries).toHaveLength(1);
		expect(entries[0].recipe.title).toBe("Pasta");
		expect(entries[0].day).toBe("MONDAY");
	});

	it("returns entries sorted by order within a day", async () => {
		const r1 = await createRecipe(TEST_USER_ID, { title: "First", tags: [] });
		const r2 = await createRecipe(TEST_USER_ID, { title: "Second", tags: [] });
		const r3 = await createRecipe(TEST_USER_ID, { title: "Third", tags: [] });
		await addEntry(TEST_USER_ID, r1.id, "TUESDAY");
		await addEntry(TEST_USER_ID, r2.id, "TUESDAY");
		await addEntry(TEST_USER_ID, r3.id, "TUESDAY");
		const entries = await getPlan(TEST_USER_ID);
		const titles = entries.map((e) => e.recipe.title);
		expect(titles).toEqual(["First", "Second", "Third"]);
	});

	it("hides entries where a liked recipe has been made private", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Now Private",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			await addEntry(TEST_USER_ID, recipe.id, "WEDNESDAY");
			await setRecipeVisibility(recipe.id, OTHER_USER_ID, false);
			const entries = await getPlan(TEST_USER_ID);
			expect(entries.map((e) => e.recipe.title)).not.toContain("Now Private");
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("addEntry", () => {
	it("adds an own recipe and returns the entry", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Risotto",
			tags: [],
		});
		const entry = await addEntry(TEST_USER_ID, recipe.id, "FRIDAY");
		expect(entry.day).toBe("FRIDAY");
		expect(entry.order).toBe(0);
		expect(entry.recipe.title).toBe("Risotto");
	});

	it("adds a liked public recipe from another user", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Shared Soup",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			const entry = await addEntry(TEST_USER_ID, recipe.id, "THURSDAY");
			expect(entry.recipe.title).toBe("Shared Soup");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("assigns incrementing order within the same day", async () => {
		const r1 = await createRecipe(TEST_USER_ID, { title: "A", tags: [] });
		const r2 = await createRecipe(TEST_USER_ID, { title: "B", tags: [] });
		const r3 = await createRecipe(TEST_USER_ID, { title: "C", tags: [] });
		const e1 = await addEntry(TEST_USER_ID, r1.id, "SATURDAY");
		const e2 = await addEntry(TEST_USER_ID, r2.id, "SATURDAY");
		const e3 = await addEntry(TEST_USER_ID, r3.id, "SATURDAY");
		expect(e1.order).toBe(0);
		expect(e2.order).toBe(1);
		expect(e3.order).toBe(2);
	});

	it("orders independently per day", async () => {
		const r1 = await createRecipe(TEST_USER_ID, { title: "A", tags: [] });
		const r2 = await createRecipe(TEST_USER_ID, { title: "B", tags: [] });
		const e1 = await addEntry(TEST_USER_ID, r1.id, "MONDAY");
		const e2 = await addEntry(TEST_USER_ID, r2.id, "TUESDAY");
		expect(e1.order).toBe(0);
		expect(e2.order).toBe(0);
	});

	it("throws when the recipe does not exist", async () => {
		await expect(
			addEntry(TEST_USER_ID, "non-existent-id", "MONDAY"),
		).rejects.toThrow("Recipe not found");
	});

	it("throws when the recipe belongs to another user and is private", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Private",
				isPublic: false,
				tags: [],
			});
			await expect(addEntry(TEST_USER_ID, recipe.id, "MONDAY")).rejects.toThrow(
				"Recipe not accessible",
			);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("adds an unliked public recipe from another user", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Not Liked",
				isPublic: true,
				tags: [],
			});
			const entry = await addEntry(TEST_USER_ID, recipe.id, "MONDAY");
			expect(entry.recipe.title).toBe("Not Liked");
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("removeEntry", () => {
	it("removes an entry from the plan", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "To Remove",
			tags: [],
		});
		const entry = await addEntry(TEST_USER_ID, recipe.id, "MONDAY");
		await removeEntry(TEST_USER_ID, entry.id);
		const remaining = await getPlan(TEST_USER_ID);
		expect(remaining).toHaveLength(0);
	});

	it("throws when the entry does not belong to the user's plan", async () => {
		await upsertOtherUser();
		try {
			const otherRecipe = await createRecipe(OTHER_USER_ID, {
				title: "Other",
				tags: [],
			});
			const otherPlan = await prisma.weeklyPlan.upsert({
				where: { userId: OTHER_USER_ID },
				create: { userId: OTHER_USER_ID },
				update: {},
			});
			const otherEntry = await prisma.planEntry.create({
				data: {
					weeklyPlanId: otherPlan.id,
					recipeId: otherRecipe.id,
					day: "MONDAY",
					order: 0,
				},
			});
			await expect(removeEntry(TEST_USER_ID, otherEntry.id)).rejects.toThrow(
				"Not found",
			);
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("clearPlan", () => {
	it("removes all entries from the plan", async () => {
		const r1 = await createRecipe(TEST_USER_ID, { title: "A", tags: [] });
		const r2 = await createRecipe(TEST_USER_ID, { title: "B", tags: [] });
		await addEntry(TEST_USER_ID, r1.id, "MONDAY");
		await addEntry(TEST_USER_ID, r2.id, "WEDNESDAY");
		await clearPlan(TEST_USER_ID);
		const entries = await getPlan(TEST_USER_ID);
		expect(entries).toHaveLength(0);
	});

	it("does not throw when the plan is already empty", async () => {
		await expect(clearPlan(TEST_USER_ID)).resolves.not.toThrow();
	});
});

describe("updateEntries", () => {
	it("updates the day and order of entries", async () => {
		const r1 = await createRecipe(TEST_USER_ID, { title: "A", tags: [] });
		const r2 = await createRecipe(TEST_USER_ID, { title: "B", tags: [] });
		const e1 = await addEntry(TEST_USER_ID, r1.id, "MONDAY");
		const e2 = await addEntry(TEST_USER_ID, r2.id, "MONDAY");
		await updateEntries(TEST_USER_ID, [
			{ id: e1.id, day: "FRIDAY", order: 1 },
			{ id: e2.id, day: "FRIDAY", order: 0 },
		]);
		const entries = await getPlan(TEST_USER_ID);
		const e1Updated = entries.find((e) => e.id === e1.id);
		const e2Updated = entries.find((e) => e.id === e2.id);
		expect(e1Updated?.day).toBe("FRIDAY");
		expect(e1Updated?.order).toBe(1);
		expect(e2Updated?.day).toBe("FRIDAY");
		expect(e2Updated?.order).toBe(0);
	});

	it("throws when any entry does not belong to the user's plan", async () => {
		const recipe = await createRecipe(TEST_USER_ID, { title: "A", tags: [] });
		const entry = await addEntry(TEST_USER_ID, recipe.id, "MONDAY");
		await expect(
			updateEntries(TEST_USER_ID, [
				{ id: entry.id, day: "TUESDAY", order: 0 },
				{ id: "non-existent-id", day: "TUESDAY", order: 1 },
			]),
		).rejects.toThrow("Not found");
	});
});

describe("getRecipeOptions", () => {
	it("returns own recipes in ownRecipes", async () => {
		await createRecipe(TEST_USER_ID, { title: "My Recipe", tags: [] });
		const { ownRecipes } = await getRecipeOptions(TEST_USER_ID);
		expect(ownRecipes.map((r) => r.title)).toContain("My Recipe");
	});

	it("returns liked public recipes from other users in likedRecipes", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Liked Public",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			const { likedRecipes } = await getRecipeOptions(TEST_USER_ID);
			expect(likedRecipes.map((r) => r.title)).toContain("Liked Public");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("does not include own recipes in likedRecipes", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "My Own",
			isPublic: true,
			tags: [],
		});
		const { likedRecipes } = await getRecipeOptions(TEST_USER_ID);
		expect(likedRecipes.map((r) => r.id)).not.toContain(recipe.id);
	});

	it("does not include unlicked public recipes from other users", async () => {
		await upsertOtherUser();
		try {
			await createRecipe(OTHER_USER_ID, {
				title: "Not Liked",
				isPublic: true,
				tags: [],
			});
			const { likedRecipes } = await getRecipeOptions(TEST_USER_ID);
			expect(likedRecipes.map((r) => r.title)).not.toContain("Not Liked");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("does not include private recipes from other users even if liked", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Now Private",
				isPublic: true,
				tags: [],
			});
			await toggleLike(recipe.id, TEST_USER_ID);
			await setRecipeVisibility(recipe.id, OTHER_USER_ID, false);
			const { likedRecipes } = await getRecipeOptions(TEST_USER_ID);
			expect(likedRecipes.map((r) => r.title)).not.toContain("Now Private");
		} finally {
			await cleanupOtherUser();
		}
	});

	it("includes public recipes from other users in allRecipes regardless of Like", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Unliked Public",
				isPublic: true,
				tags: [],
			});
			const { allRecipes } = await getRecipeOptions(TEST_USER_ID);
			expect(allRecipes.map((r) => r.id)).toContain(recipe.id);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("does not include own recipes in allRecipes", async () => {
		const recipe = await createRecipe(TEST_USER_ID, {
			title: "Mine",
			isPublic: true,
			tags: [],
		});
		const { allRecipes } = await getRecipeOptions(TEST_USER_ID);
		expect(allRecipes.map((r) => r.id)).not.toContain(recipe.id);
	});

	it("does not include private recipes from other users in allRecipes", async () => {
		await upsertOtherUser();
		try {
			const recipe = await createRecipe(OTHER_USER_ID, {
				title: "Private Other",
				isPublic: false,
				tags: [],
			});
			const { allRecipes } = await getRecipeOptions(TEST_USER_ID);
			expect(allRecipes.map((r) => r.id)).not.toContain(recipe.id);
		} finally {
			await cleanupOtherUser();
		}
	});
});
