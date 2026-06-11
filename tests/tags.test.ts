import { describe, expect, it } from "vitest";
import { prisma } from "#/db";
import { createRecipe } from "#/lib/recipe-service";
import { listPublicTagsInUse, listTagsInUse } from "#/lib/tag-service";
import {
	cleanupOtherUser,
	OTHER_USER_ID,
	setupTestUser,
	TEST_USER_ID,
	upsertOtherUser,
} from "./helpers";

setupTestUser();

describe("listTagsInUse", () => {
	it("returns tags applied to at least one recipe", async () => {
		await createRecipe(TEST_USER_ID, { title: "Recipe", tags: ["main"] });
		const tags = await listTagsInUse(TEST_USER_ID);
		expect(tags.map((t) => t.name)).toContain("main");
	});

	it("does not return tags with no recipes", async () => {
		await prisma.tag.create({
			data: { name: "orphan", userId: TEST_USER_ID },
		});
		const tags = await listTagsInUse(TEST_USER_ID);
		expect(tags.map((t) => t.name)).not.toContain("orphan");
	});

	it("returns tags sorted by name", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			tags: ["zucchini", "apple", "mango"],
		});
		const tags = await listTagsInUse(TEST_USER_ID);
		const names = tags.map((t) => t.name);
		expect(names).toEqual([...names].sort());
	});

	it("does not return tags belonging to another user", async () => {
		const OTHER_ID = "test-user-tags-isolation";
		await prisma.user.upsert({
			where: { id: OTHER_ID },
			create: {
				id: OTHER_ID,
				name: "Other",
				email: "other-tags@test.local",
				emailVerified: false,
				username: "other-tags",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			update: {},
		});
		try {
			await createRecipe(OTHER_ID, { title: "Their Recipe", tags: ["secret"] });
			const tags = await listTagsInUse(TEST_USER_ID);
			expect(tags.map((t) => t.name)).not.toContain("secret");
		} finally {
			await prisma.user.delete({ where: { id: OTHER_ID } });
		}
	});
});

describe("listPublicTagsInUse", () => {
	it("returns tag names from public recipes", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			isPublic: true,
			tags: ["italian"],
		});
		const tags = await listPublicTagsInUse();
		expect(tags.map((t) => t.name)).toContain("italian");
	});

	it("does not return tags only applied to private recipes", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Private",
			isPublic: false,
			tags: ["secret"],
		});
		const tags = await listPublicTagsInUse();
		expect(tags.map((t) => t.name)).not.toContain("secret");
	});

	it("deduplicates tag names across users", async () => {
		await upsertOtherUser();
		try {
			await createRecipe(TEST_USER_ID, {
				title: "My Recipe",
				isPublic: true,
				tags: ["italian"],
			});
			await createRecipe(OTHER_USER_ID, {
				title: "Their Recipe",
				isPublic: true,
				tags: ["italian"],
			});
			const tags = await listPublicTagsInUse();
			const italianTags = tags.filter((t) => t.name === "italian");
			expect(italianTags).toHaveLength(1);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("returns tags sorted by name", async () => {
		await createRecipe(TEST_USER_ID, {
			title: "Recipe",
			isPublic: true,
			tags: ["zucchini", "apple", "mango"],
		});
		const tags = await listPublicTagsInUse();
		const names = tags.map((t) => t.name);
		expect(names).toEqual([...names].sort());
	});
});
