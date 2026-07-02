import { describe, expect, it } from "vitest";
import { prisma } from "#/db";
import { toggleFollow } from "#/lib/follow-service";
import { findProfile } from "#/lib/profile-service";
import {
	cleanupOtherUser,
	OTHER_USER_ID,
	setupTestUser,
	TEST_USER_ID,
	upsertOtherUser,
} from "./helpers";

setupTestUser();

describe("toggleFollow", () => {
	it("creates a follow and returns true", async () => {
		await upsertOtherUser();
		try {
			const result = await toggleFollow(TEST_USER_ID, OTHER_USER_ID);
			expect(result).toBe(true);
			const follow = await prisma.follow.findUnique({
				where: {
					followerId_followingId: {
						followerId: TEST_USER_ID,
						followingId: OTHER_USER_ID,
					},
				},
			});
			expect(follow).not.toBeNull();
		} finally {
			await cleanupOtherUser();
		}
	});

	it("removes an existing follow and returns false", async () => {
		await upsertOtherUser();
		try {
			await toggleFollow(TEST_USER_ID, OTHER_USER_ID);
			const result = await toggleFollow(TEST_USER_ID, OTHER_USER_ID);
			expect(result).toBe(false);
			const follow = await prisma.follow.findUnique({
				where: {
					followerId_followingId: {
						followerId: TEST_USER_ID,
						followingId: OTHER_USER_ID,
					},
				},
			});
			expect(follow).toBeNull();
		} finally {
			await cleanupOtherUser();
		}
	});

	it("throws when the user tries to follow themselves", async () => {
		await expect(toggleFollow(TEST_USER_ID, TEST_USER_ID)).rejects.toThrow(
			"Cannot follow yourself",
		);
	});

	it("throws when the target user does not exist", async () => {
		await expect(toggleFollow(TEST_USER_ID, "non-existent-id")).rejects.toThrow(
			"User not found",
		);
	});

	it("throws when the target user is banned", async () => {
		await upsertOtherUser();
		try {
			await prisma.user.update({
				where: { id: OTHER_USER_ID },
				data: { banned: true },
			});
			await expect(toggleFollow(TEST_USER_ID, OTHER_USER_ID)).rejects.toThrow(
				"Cannot follow a banned user",
			);
		} finally {
			await cleanupOtherUser();
		}
	});
});

describe("findProfile", () => {
	it("reports isOwnProfile true when the viewer matches the profile", async () => {
		const profile = await findProfile("test-recipes-user", TEST_USER_ID);
		expect(profile?.isOwnProfile).toBe(true);
		expect(profile?.viewerIsFollowing).toBeNull();
	});

	it("reports viewerIsFollowing false when not following", async () => {
		await upsertOtherUser();
		try {
			const profile = await findProfile("other-chef", TEST_USER_ID);
			expect(profile?.isOwnProfile).toBe(false);
			expect(profile?.viewerIsFollowing).toBe(false);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("reports viewerIsFollowing true after following", async () => {
		await upsertOtherUser();
		try {
			await toggleFollow(TEST_USER_ID, OTHER_USER_ID);
			const profile = await findProfile("other-chef", TEST_USER_ID);
			expect(profile?.viewerIsFollowing).toBe(true);
		} finally {
			await cleanupOtherUser();
		}
	});

	it("reports viewerIsFollowing null for an unauthenticated viewer", async () => {
		await upsertOtherUser();
		try {
			const profile = await findProfile("other-chef", null);
			expect(profile?.viewerIsFollowing).toBeNull();
		} finally {
			await cleanupOtherUser();
		}
	});

	it("reports viewerIsFollowing null when the profile is banned", async () => {
		await upsertOtherUser();
		try {
			await prisma.user.update({
				where: { id: OTHER_USER_ID },
				data: { banned: true },
			});
			const profile = await findProfile("other-chef", TEST_USER_ID);
			expect(profile?.viewerIsFollowing).toBeNull();
		} finally {
			await cleanupOtherUser();
		}
	});
});
