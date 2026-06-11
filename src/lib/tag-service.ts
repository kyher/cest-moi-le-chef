import { prisma } from "#/db";

export function listTagsInUse(userId: string) {
	return prisma.tag.findMany({
		where: { userId, recipes: { some: {} } },
		orderBy: { name: "asc" },
	});
}

export async function listPublicTagsInUse() {
	const tags = await prisma.tag.findMany({
		where: { recipes: { some: { recipe: { isPublic: true } } } },
		select: { name: true },
		orderBy: { name: "asc" },
	});
	// Tags are already stored lowercase; deduplicate by name
	const seen = new Set<string>();
	const result: { name: string }[] = [];
	for (const tag of tags) {
		if (!seen.has(tag.name)) {
			seen.add(tag.name);
			result.push(tag);
		}
	}
	return result;
}
