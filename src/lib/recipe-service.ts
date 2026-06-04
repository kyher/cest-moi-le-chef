import { prisma } from "#/db";

async function syncTags(recipeId: string, tagNames: string[], userId: string) {
	await prisma.recipeTag.deleteMany({ where: { recipeId } });
	for (const raw of tagNames) {
		const name = raw.toLowerCase().trim();
		if (!name) continue;
		const tag = await prisma.tag.upsert({
			where: { name_userId: { name, userId } },
			create: { name, userId },
			update: {},
		});
		await prisma.recipeTag.create({ data: { recipeId, tagId: tag.id } });
	}
}

export function listRecipes(
	userId: string,
	filters: { tags?: string[]; maxTime?: number; q?: string } = {},
) {
	const tagFilters =
		filters.tags && filters.tags.length > 0
			? filters.tags.map((name) => ({ tags: { some: { tag: { name } } } }))
			: undefined;

	return prisma.recipe.findMany({
		where: {
			userId,
			AND: tagFilters,
			totalTime: filters.maxTime != null ? { lte: filters.maxTime } : undefined,
			title: filters.q
				? { contains: filters.q, mode: "insensitive" }
				: undefined,
		},
		include: {
			tags: { include: { tag: true } },
			_count: { select: { notes: true } },
		},
		orderBy: { updatedAt: "desc" },
	});
}

export function listPublicRecipes(
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
			AND: tagFilters,
			totalTime: filters.maxTime != null ? { lte: filters.maxTime } : undefined,
			title: filters.q
				? { contains: filters.q, mode: "insensitive" }
				: undefined,
		},
		include: {
			tags: { include: { tag: true } },
			user: { select: { name: true } },
		},
		orderBy: { updatedAt: "desc" },
	});
}

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

export async function findRecipe(recipeId: string, viewerId: string | null) {
	// Owner: return full recipe with notes
	if (viewerId) {
		const owned = await prisma.recipe.findFirst({
			where: { id: recipeId, userId: viewerId },
			include: {
				tags: { include: { tag: true } },
				notes: { orderBy: { createdAt: "desc" } },
				user: { select: { name: true } },
			},
		});
		if (owned) return { ...owned, isOwner: true as const };
	}

	// Non-owner: only public recipes, notes never sent
	const recipe = await prisma.recipe.findFirst({
		where: { id: recipeId, isPublic: true },
		include: {
			tags: { include: { tag: true } },
			user: { select: { name: true } },
		},
	});
	if (!recipe) return null;
	return { ...recipe, notes: [] as const, isOwner: false as const };
}

export async function createRecipe(
	userId: string,
	data: {
		title: string;
		ingredients?: string;
		method?: string;
		totalTime?: number;
		isPublic?: boolean;
		tags: string[];
	},
) {
	const recipe = await prisma.recipe.create({
		data: {
			title: data.title,
			ingredients: data.ingredients || null,
			method: data.method || null,
			totalTime: data.totalTime ?? null,
			isPublic: data.isPublic ?? false,
			userId,
		},
	});
	await syncTags(recipe.id, data.tags, userId);
	return recipe;
}

export async function updateRecipe(
	recipeId: string,
	userId: string,
	data: {
		title: string;
		ingredients?: string;
		method?: string;
		totalTime?: number;
		isPublic?: boolean;
		tags: string[];
	},
) {
	const recipe = await prisma.recipe.update({
		where: { id: recipeId, userId },
		data: {
			title: data.title,
			ingredients: data.ingredients || null,
			method: data.method || null,
			totalTime: data.totalTime ?? null,
			...(data.isPublic !== undefined && { isPublic: data.isPublic }),
		},
	});
	await syncTags(recipe.id, data.tags, userId);
	return recipe;
}

export async function setRecipeVisibility(
	recipeId: string,
	userId: string,
	isPublic: boolean,
) {
	return prisma.recipe.update({
		where: { id: recipeId, userId },
		data: { isPublic },
	});
}

export async function removeRecipe(recipeId: string, userId: string) {
	await prisma.recipe.delete({ where: { id: recipeId, userId } });
}

export async function addNote(recipeId: string, userId: string, body: string) {
	const recipe = await prisma.recipe.findFirst({
		where: { id: recipeId, userId },
	});
	if (!recipe) throw new Error("Recipe not found");
	return prisma.note.create({ data: { body, recipeId } });
}

export async function removeNote(noteId: string, userId: string) {
	const note = await prisma.note.findFirst({
		where: { id: noteId, recipe: { userId } },
	});
	if (!note) throw new Error("Note not found");
	await prisma.note.delete({ where: { id: noteId } });
}
