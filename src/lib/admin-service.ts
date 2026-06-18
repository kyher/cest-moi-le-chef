import { prisma } from "#/db";
import { deleteImageFile } from "#/lib/image-storage";

export function listAllPublicRecipes() {
	return prisma.recipe.findMany({
		where: { isPublic: true },
		include: {
			user: { select: { name: true, username: true } },
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function adminForcePrivate(recipeId: string) {
	return prisma.recipe.update({
		where: { id: recipeId },
		data: { isPublic: false },
	});
}

export async function adminDeleteRecipe(recipeId: string) {
	const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
	if (recipe?.imageUrl) await deleteImageFile(recipe.imageUrl);
	await prisma.recipe.delete({ where: { id: recipeId } });
}

export async function adminRemoveRecipeImage(recipeId: string) {
	const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
	if (!recipe) throw new Error("Recipe not found");
	if (recipe.imageUrl) await deleteImageFile(recipe.imageUrl);
	await prisma.recipe.update({
		where: { id: recipeId },
		data: { imageUrl: null },
	});
}

export function listAllUsers() {
	return prisma.user.findMany({
		select: {
			id: true,
			name: true,
			username: true,
			email: true,
			role: true,
			banned: true,
			createdAt: true,
			_count: { select: { recipes: true } },
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function banUser(
	userId: string,
	opts: { banReason?: string; banExpires?: Date } = {},
) {
	const recipes = await prisma.recipe.findMany({
		where: { userId },
		select: { imageUrl: true },
	});
	await Promise.all(
		recipes
			.filter((r): r is typeof r & { imageUrl: string } => r.imageUrl !== null)
			.map((r) => deleteImageFile(r.imageUrl)),
	);
	await prisma.recipe.deleteMany({ where: { userId } });
	await prisma.session.deleteMany({ where: { userId } });
	await prisma.user.update({
		where: { id: userId },
		data: {
			banned: true,
			banReason: opts.banReason ?? null,
			banExpires: opts.banExpires ?? null,
		},
	});
}
