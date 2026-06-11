import { prisma } from "#/db";

export async function findProfile(username: string) {
	const user = await prisma.user.findUnique({
		where: { username },
		select: {
			name: true,
			username: true,
			recipes: {
				where: { isPublic: true },
				include: { tags: { include: { tag: true } } },
				orderBy: { updatedAt: "desc" },
			},
		},
	});
	return user;
}
