import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";
import * as recipeService from "#/lib/recipe-service";

async function requireUser() {
	const request = getRequest();
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw new Error("Unauthorized");
	return session.user;
}

export const getRecipes = createServerFn()
	.inputValidator((d: { tags?: string; maxTime?: number; q?: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		const tags = data.tags?.split(",").filter(Boolean);
		return recipeService.listRecipes(user.id, {
			tags,
			maxTime: data.maxTime,
			q: data.q,
		});
	});

export const getTagsInUse = createServerFn().handler(async () => {
	const user = await requireUser();
	return recipeService.listTagsInUse(user.id);
});

export const getRecipe = createServerFn()
	.inputValidator((d: { recipeId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return recipeService.findRecipe(data.recipeId, user.id);
	});

export const createRecipe = createServerFn({ method: "POST" })
	.inputValidator(
		(d: {
			title: string;
			ingredients?: string;
			method?: string;
			totalTime?: number;
			tags: string[];
		}) => d,
	)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return recipeService.createRecipe(user.id, data);
	});

export const updateRecipe = createServerFn({ method: "POST" })
	.inputValidator(
		(d: {
			recipeId: string;
			title: string;
			ingredients?: string;
			method?: string;
			totalTime?: number;
			tags: string[];
		}) => d,
	)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return recipeService.updateRecipe(data.recipeId, user.id, data);
	});

export const deleteRecipe = createServerFn({ method: "POST" })
	.inputValidator((d: { recipeId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		await recipeService.removeRecipe(data.recipeId, user.id);
	});

export const addNote = createServerFn({ method: "POST" })
	.inputValidator((d: { recipeId: string; body: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return recipeService.addNote(data.recipeId, user.id, data.body);
	});

export const deleteNote = createServerFn({ method: "POST" })
	.inputValidator((d: { noteId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		await recipeService.removeNote(data.noteId, user.id);
	});
