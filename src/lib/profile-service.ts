import { prisma } from "#/db";

export async function findProfile(username: string, viewerId: string | null) {
	const user = await prisma.user.findUnique({
		where: { username },
		select: {
			id: true,
			name: true,
			username: true,
			banned: true,
			recipes: {
				where: { isPublic: true },
				include: { tags: { include: { tag: true } } },
				orderBy: { updatedAt: "desc" },
			},
		},
	});
	if (!user) return null;

	const isOwnProfile = viewerId === user.id;
	const viewerIsFollowing =
		viewerId && !isOwnProfile && !user.banned
			? (await prisma.follow.findUnique({
					where: {
						followerId_followingId: {
							followerId: viewerId,
							followingId: user.id,
						},
					},
				})) !== null
			: null;

	return { ...user, isOwnProfile, viewerIsFollowing };
}
