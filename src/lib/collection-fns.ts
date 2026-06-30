import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";
import * as collectionService from "#/lib/collection-service";

async function requireUser() {
	const request = getRequest();
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw new Error("Unauthorized");
	return session.user;
}

export const getCollections = createServerFn().handler(async () => {
	const user = await requireUser();
	return collectionService.listCollections(user.id);
});

export const getCollectionsForRecipe = createServerFn()
	.validator((d: { recipeId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return collectionService.listCollectionsForRecipe(user.id, data.recipeId);
	});

export const createCollection = createServerFn({ method: "POST" })
	.validator((d: { name: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return collectionService.createCollection(user.id, data.name);
	});

export const renameCollection = createServerFn({ method: "POST" })
	.validator((d: { collectionId: string; name: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return collectionService.renameCollection(
			user.id,
			data.collectionId,
			data.name,
		);
	});

export const deleteCollection = createServerFn({ method: "POST" })
	.validator((d: { collectionId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		await collectionService.deleteCollection(user.id, data.collectionId);
	});

export const getCollection = createServerFn()
	.validator((d: { collectionId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return collectionService.getCollection(user.id, data.collectionId);
	});

export const addCollectionEntry = createServerFn({ method: "POST" })
	.validator((d: { collectionId: string; recipeId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		return collectionService.addEntry(
			user.id,
			data.collectionId,
			data.recipeId,
		);
	});

export const removeCollectionEntry = createServerFn({ method: "POST" })
	.validator((d: { collectionId: string; recipeId: string }) => d)
	.handler(async ({ data }) => {
		const user = await requireUser();
		await collectionService.removeEntry(
			user.id,
			data.collectionId,
			data.recipeId,
		);
	});
