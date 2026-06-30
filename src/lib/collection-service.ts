import { prisma } from "#/db";

const recipeSelect = {
	id: true,
	title: true,
	imageUrl: true,
	totalTime: true,
	isPublic: true,
	userId: true,
	tags: { include: { tag: true } },
	user: { select: { name: true, username: true } },
	_count: { select: { likes: true } },
} as const;

export async function listCollections(userId: string) {
	return prisma.collection.findMany({
		where: { userId },
		include: { _count: { select: { entries: true } } },
		orderBy: { createdAt: "asc" },
	});
}

export async function listCollectionsForRecipe(
	userId: string,
	recipeId: string,
) {
	const collections = await prisma.collection.findMany({
		where: { userId },
		include: {
			entries: { where: { recipeId }, select: { recipeId: true } },
		},
		orderBy: { createdAt: "asc" },
	});
	return collections.map((c) => ({
		id: c.id,
		name: c.name,
		hasRecipe: c.entries.length > 0,
	}));
}

export async function createCollection(userId: string, name: string) {
	return prisma.collection.create({
		data: { userId, name: name.trim() },
		include: { _count: { select: { entries: true } } },
	});
}

export async function renameCollection(
	userId: string,
	collectionId: string,
	name: string,
) {
	const collection = await prisma.collection.findUnique({
		where: { id: collectionId },
	});
	if (!collection || collection.userId !== userId) throw new Error("Not found");
	return prisma.collection.update({
		where: { id: collectionId },
		data: { name: name.trim() },
	});
}

export async function deleteCollection(userId: string, collectionId: string) {
	const collection = await prisma.collection.findUnique({
		where: { id: collectionId },
	});
	if (!collection || collection.userId !== userId) throw new Error("Not found");
	await prisma.collection.delete({ where: { id: collectionId } });
}

export async function getCollection(userId: string, collectionId: string) {
	const collection = await prisma.collection.findUnique({
		where: { id: collectionId },
		include: {
			entries: {
				include: { recipe: { select: recipeSelect } },
				orderBy: { createdAt: "asc" },
			},
		},
	});
	if (!collection || collection.userId !== userId) return null;
	// Mirror Like/Plan Entry behaviour: hide entries whose recipe is not owned by
	// the user and is no longer public.
	const entries = collection.entries.filter(
		(e) => e.recipe.userId === userId || e.recipe.isPublic,
	);
	return { ...collection, entries };
}

export async function addEntry(
	userId: string,
	collectionId: string,
	recipeId: string,
) {
	const collection = await prisma.collection.findUnique({
		where: { id: collectionId },
	});
	if (!collection || collection.userId !== userId) throw new Error("Not found");

	const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
	if (!recipe) throw new Error("Recipe not found");
	if (recipe.userId !== userId && !recipe.isPublic)
		throw new Error("Recipe not accessible");

	// Upsert so adding an already-present recipe is a silent no-op.
	await prisma.collectionEntry.upsert({
		where: { collectionId_recipeId: { collectionId, recipeId } },
		create: { collectionId, recipeId },
		update: {},
	});

	return prisma.collectionEntry.findUniqueOrThrow({
		where: { collectionId_recipeId: { collectionId, recipeId } },
		include: { recipe: { select: recipeSelect } },
	});
}

export async function removeEntry(
	userId: string,
	collectionId: string,
	recipeId: string,
) {
	const collection = await prisma.collection.findUnique({
		where: { id: collectionId },
	});
	if (!collection || collection.userId !== userId) throw new Error("Not found");
	await prisma.collectionEntry.delete({
		where: { collectionId_recipeId: { collectionId, recipeId } },
	});
}
