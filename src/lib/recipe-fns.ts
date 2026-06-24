import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";
import * as likeService from "#/lib/like-service";
import * as noteService from "#/lib/note-service";
import * as profileService from "#/lib/profile-service";
import * as recipeService from "#/lib/recipe-service";
import * as tagService from "#/lib/tag-service";

async function requireUser() {
	const request = getRequest();
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw new Error("Unauthorized");
	return session.user;
}

async function optionalUser() {
	const request = getRequest();
	const session = await auth.api.getSession({ headers: request.headers });
	return session?.user ?? null;
}

export const getRecipes = createServerFn()
	.validator(
		(d: {
			tags?: string;
			maxTime?: number;
			q?: string;
			visibility?: "public" | "private";
		}) => d,
	)
	.handler(async ({ data }) => {
		const user = await requireUser();
		const tags = data.tags?.split(",").filter(Boolean);
		return recipeService.listRecipes(user.id, {
			tags,
			maxTime: data.maxTime,
			q: data.q,
			visibility: data.visibility,
		});
	});

export const getPublicRecipes = createServerFn()
	.validator((d: { tags?: string; maxTime?: number; q?: string }) => d)
	.handler(async ({ data }) => {
		const user = await optionalUser();
		const tags = data.tags?.split(",").filter(Boolean);
		return recipeService.listPublicRecipes(
			{ tags, maxTime: data.maxTime, q: data.q },
			user?.id ?? null,
		);
	});

export const getTagsInUse = createServerFn().handler(async () => {
	const user = await requireUser();
	return tagService.listTagsInUse(user.id);
});

export const getPublicTagsInUse = createServerFn().handler(async () => {
	return tagService.listPublicTagsInUse();
});

export const getRecipe = createServerFn()
	.validator((d: { recipeId: string }) => d)
	.handler(async ({ data }) => {
		const user = await optionalUser();
		return recipeService.findRecipe(data.recipeId, user?.id ?? null);
	});

export const createRecipe = createServerFn({ method: "POST" })
	.validator(
		(d: {
			title: string;
			ingredients?: string;
			method?: string;
			totalTime?: number;
			servings?: number;
			isPublic?: boolean;
			tags: string[];
		}) => d,
	)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return recipeService.createRecipe(user.id, data);
	});

export const updateRecipe = createServerFn({ method: "POST" })
	.validator(
		(d: {
			recipeId: string;
			title: string;
			ingredients?: string;
			method?: string;
			totalTime?: number;
			servings?: number;
			isPublic?: boolean;
			tags: string[];
		}) => d,
	)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return recipeService.updateRecipe(data.recipeId, user.id, data);
	});

export const setVisibility = createServerFn({ method: "POST" })
	.validator((d: { recipeId: string; isPublic: boolean }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return recipeService.setRecipeVisibility(
			data.recipeId,
			user.id,
			data.isPublic,
		);
	});

export const deleteRecipe = createServerFn({ method: "POST" })
	.validator((d: { recipeId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		await recipeService.removeRecipe(data.recipeId, user.id);
	});

export const addNote = createServerFn({ method: "POST" })
	.validator((d: { recipeId: string; body: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return noteService.addNote(data.recipeId, user.id, data.body);
	});

export const deleteNote = createServerFn({ method: "POST" })
	.validator((d: { noteId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		await noteService.removeNote(data.noteId, user.id);
	});

export const getProfile = createServerFn()
	.validator((d: { username: string }) => d)
	.handler(async ({ data }) => {
		return profileService.findProfile(data.username);
	});

export const toggleLike = createServerFn({ method: "POST" })
	.validator((d: { recipeId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return likeService.toggleLike(data.recipeId, user.id);
	});

export const getLikedRecipes = createServerFn()
	.validator((d: { tags?: string; maxTime?: number; q?: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		const tags = data.tags?.split(",").filter(Boolean);
		return likeService.listLikedRecipes(user.id, {
			tags,
			maxTime: data.maxTime,
			q: data.q,
		});
	});

export const getLikedTagsInUse = createServerFn().handler(async () => {
	const user = await requireUser();
	return likeService.listLikedTagsInUse(user.id);
});

export const forkRecipe = createServerFn({ method: "POST" })
	.validator((d: { recipeId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return recipeService.forkRecipe(data.recipeId, user.id);
	});
