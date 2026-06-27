import { prisma } from "#/db";

export function listTagsInUse(userId: string) {
	return prisma.tag.findMany({
		where: { userId, recipes: { some: {} } },
		orderBy: { name: "asc" },
	});
}

export function listPublicTagsInUse() {
	return prisma.tag.findMany({
		where: { recipes: { some: { recipe: { isPublic: true } } } },
		select: { name: true },
		distinct: ["name"],
		orderBy: { name: "asc" },
	});
}
