import { prisma } from "#/db";
import type { Day } from "#/generated/prisma/enums";

async function findOrCreatePlan(userId: string) {
	return prisma.weeklyPlan.upsert({
		where: { userId },
		create: { userId },
		update: {},
	});
}

export async function getPlan(userId: string) {
	const plan = await findOrCreatePlan(userId);
	const entries = await prisma.planEntry.findMany({
		where: { weeklyPlanId: plan.id },
		include: {
			recipe: {
				select: {
					id: true,
					title: true,
					imageUrl: true,
					totalTime: true,
					ingredients: true,
					userId: true,
					isPublic: true,
				},
			},
		},
		orderBy: { order: "asc" },
	});
	// Mirror Like behaviour: hide entries where the recipe is not owned by the
	// user AND is not public (i.e. it's a liked recipe that became private).
	return entries.filter((e) => e.recipe.userId === userId || e.recipe.isPublic);
}

export async function addEntry(userId: string, recipeId: string, day: Day) {
	// Validate eligibility: own recipe OR liked public recipe from another user
	const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
	if (!recipe) throw new Error("Recipe not found");

	const isOwn = recipe.userId === userId;
	if (!isOwn) {
		if (!recipe.isPublic) throw new Error("Recipe not accessible");
		const like = await prisma.like.findUnique({
			where: { userId_recipeId: { userId, recipeId } },
		});
		if (!like) throw new Error("Recipe not in your liked recipes");
	}

	const plan = await findOrCreatePlan(userId);

	const maxOrderEntry = await prisma.planEntry.findFirst({
		where: { weeklyPlanId: plan.id, day },
		orderBy: { order: "desc" },
		select: { order: true },
	});
	const order = (maxOrderEntry?.order ?? -1) + 1;

	return prisma.planEntry.create({
		data: { weeklyPlanId: plan.id, recipeId, day, order },
		include: {
			recipe: {
				select: {
					id: true,
					title: true,
					imageUrl: true,
					totalTime: true,
					ingredients: true,
					userId: true,
					isPublic: true,
				},
			},
		},
	});
}

export async function removeEntry(userId: string, entryId: string) {
	const plan = await findOrCreatePlan(userId);
	const entry = await prisma.planEntry.findUnique({ where: { id: entryId } });
	if (!entry || entry.weeklyPlanId !== plan.id) throw new Error("Not found");
	await prisma.planEntry.delete({ where: { id: entryId } });
}

export async function clearPlan(userId: string) {
	const plan = await findOrCreatePlan(userId);
	await prisma.planEntry.deleteMany({ where: { weeklyPlanId: plan.id } });
}

export async function updateEntries(
	userId: string,
	updates: { id: string; day: Day; order: number }[],
) {
	const plan = await findOrCreatePlan(userId);
	// Verify all entries belong to this user's plan
	const entryIds = updates.map((u) => u.id);
	const owned = await prisma.planEntry.findMany({
		where: { id: { in: entryIds }, weeklyPlanId: plan.id },
		select: { id: true },
	});
	if (owned.length !== entryIds.length) throw new Error("Not found");

	await prisma.$transaction(
		updates.map((u) =>
			prisma.planEntry.update({
				where: { id: u.id },
				data: { day: u.day, order: u.order },
			}),
		),
	);
}

export async function getRecipeOptions(userId: string) {
	const [ownRecipes, likedRecipes] = await Promise.all([
		prisma.recipe.findMany({
			where: { userId },
			select: { id: true, title: true, imageUrl: true, totalTime: true },
			orderBy: { updatedAt: "desc" },
		}),
		prisma.recipe.findMany({
			where: {
				isPublic: true,
				userId: { not: userId },
				likes: { some: { userId } },
			},
			select: { id: true, title: true, imageUrl: true, totalTime: true },
			orderBy: { updatedAt: "desc" },
		}),
	]);
	return { ownRecipes, likedRecipes };
}
