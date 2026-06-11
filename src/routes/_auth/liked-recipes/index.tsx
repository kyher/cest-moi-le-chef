import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RecipeFilterPanel } from "#/components/-recipe-filter-panel";
import { formatTotalTime } from "#/lib/format";
import { useRecipeFilters, validateRecipeSearch } from "#/lib/recipe-filters";
import { getLikedRecipes, getLikedTagsInUse } from "#/lib/recipe-fns";

export const Route = createFileRoute("/_auth/liked-recipes/")({
	validateSearch: validateRecipeSearch,
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) =>
		Promise.all([getLikedRecipes({ data: deps }), getLikedTagsInUse()]).then(
			([recipes, tagsInUse]) => ({ recipes, tagsInUse }),
		),
	component: LikedRecipesPage,
});

function LikedRecipesPage() {
	const { recipes, tagsInUse } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const filters = useRecipeFilters(search, navigate);
	const showFilters = recipes.length > 0 || filters.hasConstraints;

	return (
		<div className="py-10">
			<h1 className="text-3xl font-bold font-serif text-stone-900 mb-8">
				Liked Recipes
			</h1>

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

			{recipes.length === 0 ? (
				<p className="text-stone-500">
					{filters.hasConstraints ? (
						<>
							No recipes match your filters.{" "}
							<button
								type="button"
								onClick={filters.reset}
								className="text-stone-800 underline underline-offset-2 cursor-pointer"
							>
								Reset
							</button>
						</>
					) : (
						<>
							No liked recipes yet.{" "}
							<Link
								to="/recipes"
								className="text-stone-800 underline underline-offset-2"
							>
								Browse recipes to find some.
							</Link>
						</>
					)}
				</p>
			) : (
				<div className="space-y-2">
					{recipes.map((recipe) => (
						<div
							key={recipe.id}
							className="relative flex items-start justify-between gap-4 p-5 bg-stone-50 border border-stone-200 border-l-2 border-l-amber-300 hover:border-l-amber-500 transition-colors"
						>
							<Link
								to="/recipes/$recipeId"
								params={{ recipeId: recipe.id }}
								className="absolute inset-0"
								aria-label={recipe.title}
							/>
							<div className="flex items-start gap-4 flex-1 min-w-0">
								{recipe.imageUrl && (
									<img
										src={recipe.imageUrl}
										alt=""
										className="relative w-16 h-16 object-cover rounded-sm shrink-0 border border-stone-200"
									/>
								)}
								<div className="relative min-w-0">
									<h2 className="font-semibold font-serif text-stone-900">
										{recipe.title}
									</h2>
									<Link
										to="/profile/$username"
										params={{ username: recipe.user.username }}
										className="text-xs text-stone-400 mt-0.5 hover:text-stone-600 hover:underline underline-offset-2"
									>
										by {recipe.user.name}
									</Link>
									{recipe.tags.length > 0 && (
										<div className="flex flex-wrap gap-1 mt-2">
											{recipe.tags.map(({ tag }) => (
												<span
													key={tag.id}
													className="px-2 py-0.5 text-xs bg-amber-50 text-stone-600 border border-amber-200"
												>
													{tag.name}
												</span>
											))}
										</div>
									)}
								</div>
							</div>
							<div className="relative flex items-center gap-2 shrink-0 mt-0.5">
								{recipe.totalTime != null && (
									<span className="text-xs text-stone-500">
										{formatTotalTime(recipe.totalTime)}
									</span>
								)}
								{recipe._count.likes > 0 && (
									<span className="text-xs text-stone-400">
										♥ {recipe._count.likes}
									</span>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
