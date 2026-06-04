import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RecipeFilterPanel } from "#/components/-recipe-filter-panel";
import { useRecipeFilters, validateRecipeSearch } from "#/lib/recipe-filters";
import { getRecipes, getTagsInUse } from "#/lib/recipes";
import { RecipeList } from "./_components/-recipe-list";

export const Route = createFileRoute("/_auth/my-recipes/")({
	validateSearch: validateRecipeSearch,
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) =>
		Promise.all([getRecipes({ data: deps }), getTagsInUse()]).then(
			([recipes, tagsInUse]) => ({ recipes, tagsInUse }),
		),
	component: MyRecipesPage,
});

function MyRecipesPage() {
	const { recipes, tagsInUse } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const filters = useRecipeFilters(search, navigate);
	const showFilters = recipes.length > 0 || filters.hasConstraints;

	return (
		<div className="py-10">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<h1 className="text-3xl font-bold text-stone-900">My Recipes</h1>
				<Link
					to="/my-recipes/new"
					className="h-9 px-4 text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center self-start sm:self-auto"
				>
					+ New Recipe
				</Link>
			</div>

			<RecipeFilterPanel
				show={showFilters}
				tagsInUse={tagsInUse}
				activeTags={filters.activeTags}
				activeMaxTime={filters.activeMaxTime}
				hasConstraints={filters.hasConstraints}
				searchInput={filters.searchInput}
				onSearchChange={filters.setSearchInput}
				onToggleTag={filters.toggleTag}
				onToggleMaxTime={filters.toggleMaxTime}
				onReset={filters.reset}
			/>

			<RecipeList
				recipes={recipes}
				hasConstraints={filters.hasConstraints}
				onReset={filters.reset}
			/>
		</div>
	);
}
