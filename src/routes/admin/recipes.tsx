import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
	adminDeleteRecipe,
	adminForcePrivate,
	adminRemoveRecipeImage,
	getAdminRecipes,
} from "#/lib/admin-fns";

export const Route = createFileRoute("/admin/recipes")({
	loader: () => getAdminRecipes(),
	component: AdminRecipesPage,
});

type Recipe = Awaited<ReturnType<typeof getAdminRecipes>>[number];

function AdminRecipesPage() {
	const recipes = Route.useLoaderData();
	const router = useRouter();
	const [pending, setPending] = useState<string | null>(null);

	if (recipes.length === 0) {
		return <p className="text-stone-500 text-sm">No public recipes.</p>;
	}

	async function act(
		recipeId: string,
		action: () => Promise<unknown>,
		successMsg: string,
	) {
		setPending(recipeId);
		try {
			await action();
			toast(successMsg);
			await router.invalidate();
		} catch {
			toast.error("Action failed.");
		} finally {
			setPending(null);
		}
	}

	return (
		<div className="pb-12">
			<p className="text-sm text-stone-500 mb-6">
				{recipes.length} public {recipes.length === 1 ? "recipe" : "recipes"}
			</p>
			<div className="space-y-3">
				{recipes.map((recipe) => (
					<RecipeRow
						key={recipe.id}
						recipe={recipe}
						disabled={pending === recipe.id}
						onForcePrivate={() =>
							act(
								recipe.id,
								() => adminForcePrivate({ data: { recipeId: recipe.id } }),
								"Recipe set to private.",
							)
						}
						onDelete={() =>
							act(
								recipe.id,
								() => adminDeleteRecipe({ data: { recipeId: recipe.id } }),
								"Recipe deleted.",
							)
						}
						onRemoveImage={() =>
							act(
								recipe.id,
								() => adminRemoveRecipeImage({ data: { recipeId: recipe.id } }),
								"Image removed.",
							)
						}
					/>
				))}
			</div>
		</div>
	);
}

function RecipeRow({
	recipe,
	disabled,
	onForcePrivate,
	onDelete,
	onRemoveImage,
}: {
	recipe: Recipe;
	disabled: boolean;
	onForcePrivate: () => void;
	onDelete: () => void;
	onRemoveImage: () => void;
}) {
	const [confirmDelete, setConfirmDelete] = useState(false);

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 p-4 rounded-sm border border-stone-200 bg-white">
			<div className="flex items-start gap-3 min-w-0">
				{recipe.imageUrl && (
					<img
						src={recipe.imageUrl}
						alt=""
						className="w-12 h-12 rounded-sm object-cover flex-shrink-0"
					/>
				)}
				<div className="min-w-0">
					<p className="text-sm font-medium text-stone-900 truncate">
						{recipe.title}
					</p>
					<p className="text-xs text-stone-500">
						by <span className="font-medium">{recipe.user.name}</span>{" "}
						<span className="text-stone-400">@{recipe.user.username}</span>
					</p>
				</div>
			</div>

			<div className="flex items-center gap-2 flex-wrap flex-shrink-0">
				{recipe.imageUrl && (
					<button
						type="button"
						disabled={disabled}
						onClick={onRemoveImage}
						className="h-8 px-3 text-xs font-medium rounded-sm border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
					>
						Remove image
					</button>
				)}
				<button
					type="button"
					disabled={disabled}
					onClick={onForcePrivate}
					className="h-8 px-3 text-xs font-medium rounded-sm border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
				>
					Force private
				</button>
				{confirmDelete ? (
					<>
						<button
							type="button"
							disabled={disabled}
							onClick={() => {
								setConfirmDelete(false);
								onDelete();
							}}
							className="h-8 px-3 text-xs font-medium rounded-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
						>
							Confirm delete
						</button>
						<button
							type="button"
							onClick={() => setConfirmDelete(false)}
							className="h-8 px-3 text-xs font-medium rounded-sm border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
						>
							Cancel
						</button>
					</>
				) : (
					<button
						type="button"
						disabled={disabled}
						onClick={() => setConfirmDelete(true)}
						className="h-8 px-3 text-xs font-medium rounded-sm border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
					>
						Delete
					</button>
				)}
			</div>
		</div>
	);
}
