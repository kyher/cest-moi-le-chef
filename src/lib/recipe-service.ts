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

export function listTagsInUse(userId: string) {
	return prisma.tag.findMany({
		where: { userId, recipes: { some: {} } },
		orderBy: { name: "asc" },
	});
}

export function findRecipe(recipeId: string, userId: string) {
	return prisma.recipe.findFirst({
		where: { id: recipeId, userId },
		include: {
			tags: { include: { tag: true } },
			notes: { orderBy: { createdAt: "desc" } },
		},
	});
}

export async function createRecipe(
	userId: string,
	data: {
		title: string;
		ingredients?: string;
		method?: string;
		totalTime?: number;
		tags: string[];
	},
) {
	const recipe = await prisma.recipe.create({
		data: {
			title: data.title,
			ingredients: data.ingredients || null,
			method: data.method || null,
			totalTime: data.totalTime ?? null,
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
		},
	});
	await syncTags(recipe.id, data.tags, userId);
	return recipe;
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
