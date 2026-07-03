import { prisma } from "#/db";

export async function toggleFollow(followerId: string, followingId: string) {
	if (followerId === followingId) throw new Error("Cannot follow yourself");

	const target = await prisma.user.findUnique({
		where: { id: followingId },
		select: { banned: true },
	});
	if (!target) throw new Error("User not found");
	if (target.banned) throw new Error("Cannot follow a banned user");

	const existing = await prisma.follow.findUnique({
		where: { followerId_followingId: { followerId, followingId } },
	});
	if (existing) {
		await prisma.follow.delete({
			where: { followerId_followingId: { followerId, followingId } },
		});
		return false;
	}
	await prisma.follow.create({ data: { followerId, followingId } });
	return true;
}

export function countFollowing(userId: string) {
	return prisma.follow.count({ where: { followerId: userId } });
}
