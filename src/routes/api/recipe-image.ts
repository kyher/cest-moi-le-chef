import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#/lib/auth";
import { prisma } from "#/db";
import { deleteImageFile, writeImageFile } from "#/lib/image-storage";

export const Route = createFileRoute("/api/recipe-image")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session) return new Response("Unauthorized", { status: 401 });

				const formData = await request.formData();
				const recipeId = formData.get("recipeId");
				const action = formData.get("action");
				const file = formData.get("image");

				if (typeof recipeId !== "string" || !recipeId) {
					return new Response("Missing recipeId", { status: 400 });
				}

				const recipe = await prisma.recipe.findFirst({
					where: { id: recipeId, userId: session.user.id },
				});
				if (!recipe) return new Response("Not found", { status: 404 });

				if (action === "remove") {
					if (recipe.imageUrl) await deleteImageFile(recipe.imageUrl);
					await prisma.recipe.update({
						where: { id: recipeId },
						data: { imageUrl: null },
					});
					return Response.json({ imageUrl: null });
				}

				if (!(file instanceof File)) {
					return new Response("Missing image file", { status: 400 });
				}

				try {
					if (recipe.imageUrl) await deleteImageFile(recipe.imageUrl);
					const imageUrl = await writeImageFile(file);
					await prisma.recipe.update({
						where: { id: recipeId },
						data: { imageUrl },
					});
					return Response.json({ imageUrl });
				} catch (err) {
					const message =
						err instanceof Error ? err.message : "Upload failed";
					return new Response(message, { status: 400 });
				}
			},
		},
	},
});
