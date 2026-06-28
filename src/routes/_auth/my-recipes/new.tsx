import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RecipeForm } from "#/components/-recipe-form";
import { createRecipe } from "#/lib/recipe-fns";

export const Route = createFileRoute("/_auth/my-recipes/new")({
	component: NewRecipe,
});

function NewRecipe() {
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<div className="py-10">
			<h1 className="text-3xl font-bold font-serif text-stone-900 mb-8">
				{t("newRecipe.title")}
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
					toast(t("recipeToast.saved"));
					await router.navigate({
						to: "/recipes/$recipeId",
						params: { recipeId: recipe.id },
					});
				}}
				submitLabel={t("newRecipe.save")}
				pendingLabel={t("newRecipe.saving")}
			/>
		</div>
	);
}
