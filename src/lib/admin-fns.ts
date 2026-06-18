import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import * as adminService from "#/lib/admin-service";
import { auth } from "#/lib/auth";

async function requireAdmin() {
	const request = getRequest();
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw new Error("Unauthorized");
	if (session.user.role !== "admin") throw new Error("Forbidden");
	return session.user;
}

export const getAdminRecipes = createServerFn().handler(async () => {
	await requireAdmin();
	return adminService.listAllPublicRecipes();
});

export const adminForcePrivate = createServerFn({ method: "POST" })
	.validator((d: { recipeId: string }) => d)
	.handler(async ({ data }) => {
		await requireAdmin();
		await adminService.adminForcePrivate(data.recipeId);
	});

export const adminDeleteRecipe = createServerFn({ method: "POST" })
	.validator((d: { recipeId: string }) => d)
	.handler(async ({ data }) => {
		await requireAdmin();
		await adminService.adminDeleteRecipe(data.recipeId);
	});

export const adminRemoveRecipeImage = createServerFn({ method: "POST" })
	.validator((d: { recipeId: string }) => d)
	.handler(async ({ data }) => {
		await requireAdmin();
		await adminService.adminRemoveRecipeImage(data.recipeId);
	});

export const getAdminUsers = createServerFn().handler(async () => {
	await requireAdmin();
	return adminService.listAllUsers();
});

export const adminBanUser = createServerFn({ method: "POST" })
	.validator(
		(d: { userId: string; banReason?: string; banExpires?: string }) => d,
	)
	.handler(async ({ data }) => {
		await requireAdmin();
		await adminService.banUser(data.userId, {
			banReason: data.banReason || undefined,
			banExpires: data.banExpires ? new Date(data.banExpires) : undefined,
		});
	});
