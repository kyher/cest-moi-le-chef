import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RecipeFilterPanel } from "#/components/-recipe-filter-panel";
import { SiteHeader } from "#/components/-site-header";
import { formatTotalTime } from "#/lib/format";
import { useRecipeFilters, validateRecipeSearch } from "#/lib/recipe-filters";
import { getPublicRecipes, getPublicTagsInUse } from "#/lib/recipes";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/")({
	validateSearch: validateRecipeSearch,
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) =>
		Promise.all([
			getSession(),
			getPublicRecipes({ data: deps }),
			getPublicTagsInUse(),
		]).then(([session, recipes, tagsInUse]) => ({
			session,
			recipes,
			tagsInUse,
		})),
	component: HomePage,
});

function HomePage() {
	const { session, recipes, tagsInUse } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const filters = useRecipeFilters(search, navigate);
	const showFilters = recipes.length > 0 || filters.hasConstraints;

	return (
		<div className="min-h-screen flex flex-col">
			<SiteHeader user={session?.user ?? null} />
			<div className="w-3/4 mx-auto py-10">
				<h1 className="text-3xl font-bold font-serif text-stone-900 mb-8">
					Recipes
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
							"No public recipes yet."
						)}
					</p>
				) : (
					<div className="space-y-2">
						{recipes.map((recipe) => (
							<Link
								key={recipe.id}
								to="/recipes/$recipeId"
								params={{ recipeId: recipe.id }}
								className="flex items-start justify-between gap-4 p-5 bg-stone-50 border border-stone-200 border-l-2 border-l-amber-300 hover:border-l-amber-500 transition-colors"
							>
								<div>
									<h2 className="font-semibold font-serif text-stone-900">
										{recipe.title}
									</h2>
									<p className="text-xs text-stone-400 mt-0.5">
										by {recipe.user.name}
									</p>
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
								{recipe.totalTime != null && (
									<span className="text-xs text-stone-500 shrink-0 mt-0.5">
										{formatTotalTime(recipe.totalTime)}
									</span>
								)}
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
