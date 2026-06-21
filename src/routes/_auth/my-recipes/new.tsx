import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { RecipeForm } from "#/components/-recipe-form";
import { createRecipe } from "#/lib/recipe-fns";

export const Route = createFileRoute("/_auth/my-recipes/new")({
	component: NewRecipe,
});

function NewRecipe() {
	const router = useRouter();

	return (
		<div className="py-10">
			<Link
				to="/my-recipes"
				search={{}}
				className="text-sm text-stone-500 hover:text-stone-800 mb-6 inline-block"
			>
				← My Recipes
			</Link>
			<h1 className="text-3xl font-bold font-serif text-stone-900 mb-8">
				New Recipe
			</h1>
			<RecipeForm
				onSubmit={async (data, { file }) => {
					const recipe = await createRecipe({ data });
					if (file) {
						const fd = new FormData();
						fd.append("recipeId", recipe.id);
						fd.append("image", file);
						await fetch("/api/recipe-image", { method: "POST", body: fd });
					}
					toast("Recipe saved");
					await router.navigate({
						to: "/recipes/$recipeId",
						params: { recipeId: recipe.id },
					});
				}}
				submitLabel="Save Recipe"
				pendingLabel="Saving…"
			/>
		</div>
	);
}
