import {
	createFileRoute,
	Link,
	notFound,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { toast } from "sonner";
import { RecipeForm } from "#/components/-recipe-form";
import { SiteHeader } from "#/components/-site-header";
import { getRecipe, updateRecipe } from "#/lib/recipe-fns";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/recipes/$recipeId/edit")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) throw redirect({ to: "/sign-in" });
		return { session };
	},
	loader: async ({ params, context }) => {
		const recipe = await getRecipe({ data: { recipeId: params.recipeId } });
		if (!recipe?.isOwner) throw notFound();
		return { recipe, session: context.session };
	},
	notFoundComponent: () => (
		<div className="min-h-screen flex flex-col">
			<div className="p-8 text-stone-500">Recipe not found.</div>
		</div>
	),
	component: EditRecipe,
});

function EditRecipe() {
	const { recipe, session } = Route.useLoaderData();
	const router = useRouter();

	return (
		<div className="min-h-screen flex flex-col">
			<SiteHeader user={session.user} />
			<div className="w-3/4 mx-auto">
				<div className="py-10">
					<Link
						to="/recipes/$recipeId"
						params={{ recipeId: recipe.id }}
						className="text-sm text-stone-500 hover:text-stone-800 mb-6 inline-block"
					>
						← {recipe.title}
					</Link>
					<h1 className="text-3xl font-bold font-serif text-stone-900 mb-8">
						Edit Recipe
					</h1>
					<RecipeForm
						initialValues={{
							title: recipe.title,
							ingredients: recipe.ingredients ?? undefined,
							method: recipe.method ?? undefined,
							totalTime: recipe.totalTime,
							servings: recipe.servings,
							tags: recipe.tags.map(({ tag }) => tag.name),
							isPublic: recipe.isPublic,
							imageUrl: recipe.imageUrl,
						}}
						onSubmit={async (data, { file, remove }) => {
							if (file) {
								const fd = new FormData();
								fd.append("recipeId", recipe.id);
								fd.append("image", file);
								await fetch("/api/recipe-image", { method: "POST", body: fd });
							} else if (remove) {
								const fd = new FormData();
								fd.append("recipeId", recipe.id);
								fd.append("action", "remove");
								await fetch("/api/recipe-image", { method: "POST", body: fd });
							}
							await updateRecipe({
								data: { recipeId: recipe.id, ...data },
							});
							toast("Recipe saved");
							await router.navigate({
								to: "/recipes/$recipeId",
								params: { recipeId: recipe.id },
							});
						}}
						submitLabel="Save Changes"
						pendingLabel="Saving…"
					/>
				</div>
			</div>
		</div>
	);
}
