import { prisma } from "#/db";
import { deleteImageFile } from "#/lib/image-storage";

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
	filters: {
		tags?: string[];
		maxTime?: number;
		q?: string;
		visibility?: "public" | "private";
	} = {},
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
			isPublic:
				filters.visibility === "public"
					? true
					: filters.visibility === "private"
						? false
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
	viewerId?: string | null,
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
			user: { select: { name: true, username: true } },
			_count: { select: { likes: true } },
			likes: viewerId
				? { where: { userId: viewerId }, select: { userId: true } }
				: false,
		},
		orderBy: { updatedAt: "desc" },
	});
}

const forkedFromSelect = {
	select: { id: true, title: true, isPublic: true },
} as const;

export async function findRecipe(recipeId: string, viewerId: string | null) {
	// Owner: return full recipe with notes; owners cannot like their own recipe
	if (viewerId) {
		const owned = await prisma.recipe.findFirst({
			where: { id: recipeId, userId: viewerId },
			include: {
				tags: { include: { tag: true } },
				notes: { where: { userId: viewerId }, orderBy: { createdAt: "desc" } },
				user: { select: { name: true, username: true } },
				_count: { select: { likes: true } },
				forkedFrom: forkedFromSelect,
			},
		});
		if (owned) {
			return {
				...owned,
				likeCount: owned._count.likes,
				viewerHasLiked: null as null,
				isOwner: true as const,
			};
		}
	}

	// Non-owner: only public recipes, fetch the viewer's own notes
	const recipe = await prisma.recipe.findFirst({
		where: { id: recipeId, isPublic: true },
		include: {
			tags: { include: { tag: true } },
			user: { select: { name: true, username: true } },
			_count: { select: { likes: true } },
			likes: viewerId
				? { where: { userId: viewerId }, select: { userId: true } }
				: false,
			notes: viewerId
				? { where: { userId: viewerId }, orderBy: { createdAt: "desc" } }
				: false,
			forkedFrom: forkedFromSelect,
		},
	});
	if (!recipe) return null;
	return {
		...recipe,
		likeCount: recipe._count.likes,
		viewerHasLiked: viewerId ? recipe.likes.length > 0 : null,
		notes: viewerId ? recipe.notes : ([] as const),
		isOwner: false as const,
	};
}

export async function forkRecipe(recipeId: string, userId: string) {
	const source = await prisma.recipe.findFirst({
		where: { id: recipeId, OR: [{ isPublic: true }, { userId }] },
		include: { tags: { include: { tag: true } } },
	});
	if (!source) throw new Error("Recipe not found");

	const fork = await prisma.recipe.create({
		data: {
			title: source.title,
			ingredients: source.ingredients,
			method: source.method,
			totalTime: source.totalTime,
			servings: source.servings,
			isPublic: false,
			userId,
			forkedFromId: recipeId,
		},
	});

	await syncTags(
		fork.id,
		source.tags.map(({ tag }) => tag.name),
		userId,
	);
	return fork;
}

export async function createRecipe(
	userId: string,
	data: {
		title: string;
		ingredients?: string;
		method?: string;
		totalTime?: number;
		servings?: number;
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
			servings: data.servings ?? null,
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
		servings?: number;
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
			servings: data.servings ?? null,
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
	const recipe = await prisma.recipe.findFirst({
		where: { id: recipeId, userId },
	});
	if (recipe?.imageUrl) await deleteImageFile(recipe.imageUrl);
	await prisma.recipe.delete({ where: { id: recipeId, userId } });
}

export async function removeRecipeImage(recipeId: string, userId: string) {
	const recipe = await prisma.recipe.findFirst({
		where: { id: recipeId, userId },
	});
	if (!recipe) throw new Error("Recipe not found");
	if (recipe.imageUrl) await deleteImageFile(recipe.imageUrl);
	await prisma.recipe.update({
		where: { id: recipeId },
		data: { imageUrl: null },
	});
}
