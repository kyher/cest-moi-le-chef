import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { Day } from "#/generated/prisma/enums";
import { auth } from "#/lib/auth";
import * as weeklyPlanService from "#/lib/weekly-plan-service";

async function requireUser() {
	const request = getRequest();
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw new Error("Unauthorized");
	return session.user;
}

export const getWeeklyPlan = createServerFn().handler(async () => {
	const user = await requireUser();
	return weeklyPlanService.getPlan(user.id);
});

export const getWeeklyPlanRecipeOptions = createServerFn().handler(async () => {
	const user = await requireUser();
	return weeklyPlanService.getRecipeOptions(user.id);
});

export const addPlanEntry = createServerFn({ method: "POST" })
	.validator((d: { recipeId: string; day: Day }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return weeklyPlanService.addEntry(user.id, data.recipeId, data.day);
	});

export const removePlanEntry = createServerFn({ method: "POST" })
	.validator((d: { entryId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		await weeklyPlanService.removeEntry(user.id, data.entryId);
	});

export const updatePlanEntries = createServerFn({ method: "POST" })
	.validator((d: { updates: { id: string; day: Day; order: number }[] }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		await weeklyPlanService.updateEntries(user.id, data.updates);
	});

export const clearWeeklyPlan = createServerFn({ method: "POST" }).handler(
	async () => {
		const user = await requireUser();
		await weeklyPlanService.clearPlan(user.id);
	},
);
