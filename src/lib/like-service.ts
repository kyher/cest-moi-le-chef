import { prisma } from "#/db";

export async function toggleLike(recipeId: string, userId: string) {
	const recipe = await prisma.recipe.findUnique({
		where: { id: recipeId },
		select: { userId: true },
	});
	if (!recipe) throw new Error("Recipe not found");
	if (recipe.userId === userId) throw new Error("Cannot like your own recipe");

	const existing = await prisma.like.findUnique({
		where: { userId_recipeId: { userId, recipeId } },
	});
	if (existing) {
		await prisma.like.delete({
			where: { userId_recipeId: { userId, recipeId } },
		});
		return false;
	}
	await prisma.like.create({ data: { userId, recipeId } });
	return true;
}

export async function listLikedRecipes(
	userId: string,
	filters: { tags?: string[]; maxTime?: number; q?: string } = {},
) {
	const tagFilters =
		filters.tags && filters.tags.length > 0
			? filters.tags.map((name) => ({
					tags: { some: { tag: { name: name.toLowerCase() } } },
				}))
			: undefined;

	return prisma.recipe.findMany({
		where: {
			isPublic: true,
			likes: { some: { userId } },
			AND: tagFilters,
			totalTime: filters.maxTime != null ? { lte: filters.maxTime } : undefined,
			title: filters.q
				? { contains: filters.q, mode: "insensitive" }
				: undefined,
		},
		include: {
			tags: { include: { tag: true } },
			user: { select: { name: true, username: true } },
			_count: { select: { likes: true } },
		},
		orderBy: { updatedAt: "desc" },
	});
}

export async function listLikedTagsInUse(userId: string) {
	const tags = await prisma.tag.findMany({
		where: {
			recipes: {
				some: {
					recipe: { isPublic: true, likes: { some: { userId } } },
				},
			},
		},
		select: { name: true },
		orderBy: { name: "asc" },
	});
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
