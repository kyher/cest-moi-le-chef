import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatTotalTime } from "#/lib/format";
import { getRecipes, getTagsInUse } from "#/lib/recipes";

const TIME_BUCKETS = [
	{ label: "≤15m", value: 15 },
	{ label: "≤30m", value: 30 },
	{ label: "≤1h", value: 60 },
	{ label: "≤2h", value: 120 },
] as const;

export const Route = createFileRoute("/_auth/recipes/")({
	validateSearch: (
		search: Record<string, unknown>,
	): { tags?: string; maxTime?: number } => {
		const tags =
			typeof search.tags === "string" && search.tags ? search.tags : undefined;
		const maxTimeRaw = Number(search.maxTime);
		const maxTime =
			search.maxTime != null &&
			search.maxTime !== "" &&
			!Number.isNaN(maxTimeRaw)
				? maxTimeRaw
				: undefined;
		return { tags, maxTime };
	},
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) =>
		Promise.all([getRecipes({ data: deps }), getTagsInUse()]).then(
			([recipes, tagsInUse]) => ({ recipes, tagsInUse }),
		),
	component: RecipeList,
});

function RecipeList() {
	const { recipes, tagsInUse } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const activeTags = search.tags?.split(",").filter(Boolean) ?? [];
	const activeMaxTime = search.maxTime;
	const hasFilters = activeTags.length > 0 || activeMaxTime != null;
	const showFilters = recipes.length > 0 || hasFilters;

	function toggleTag(tagName: string) {
		const next = activeTags.includes(tagName)
			? activeTags.filter((t) => t !== tagName)
			: [...activeTags, tagName];
		navigate({
			search: (prev) => ({
				...prev,
				tags: next.length > 0 ? next.join(",") : undefined,
			}),
		});
	}

	function toggleMaxTime(minutes: number) {
		navigate({
			search: (prev) => ({
				...prev,
				maxTime: prev.maxTime === minutes ? undefined : minutes,
			}),
		});
	}

	function clearFilters() {
		navigate({ search: { tags: undefined, maxTime: undefined } });
	}

	return (
		<div className="max-w-3xl mx-auto px-4 py-10">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-serif font-bold text-stone-900">
					My Recipes
				</h1>
				<Link
					to="/recipes/new"
					className="h-9 px-4 text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
				>
					+ New Recipe
				</Link>
			</div>

			{showFilters && (
				<div className="mb-6 border border-stone-200 p-4">
					<p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">
						Filters
					</p>
					<div className="space-y-2">
						{tagsInUse.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{tagsInUse.map((tag) => {
									const active = activeTags.includes(tag.name);
									return (
										<button
											type="button"
											key={tag.id}
											onClick={() => toggleTag(tag.name)}
											className={
												active
													? "px-2.5 py-1 text-xs font-medium bg-amber-100 text-stone-800 border border-amber-400 cursor-pointer"
													: "px-2.5 py-1 text-xs text-stone-600 bg-white border border-stone-300 hover:border-stone-400 transition-colors cursor-pointer"
											}
										>
											{tag.name}
										</button>
									);
								})}
							</div>
						)}
						<div className="flex flex-wrap gap-2 items-center">
							{TIME_BUCKETS.map(({ label, value }) => {
								const active = activeMaxTime === value;
								return (
									<button
										type="button"
										key={value}
										onClick={() => toggleMaxTime(value)}
										className={
											active
												? "px-2.5 py-1 text-xs font-medium bg-stone-800 text-white cursor-pointer"
												: "px-2.5 py-1 text-xs text-stone-600 bg-white border border-stone-300 hover:border-stone-400 transition-colors cursor-pointer"
										}
									>
										{label}
									</button>
								);
							})}
							{hasFilters && (
								<button
									type="button"
									onClick={clearFilters}
									className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700 transition-colors cursor-pointer"
								>
									Clear all
								</button>
							)}
						</div>
					</div>
				</div>
			)}

			{recipes.length === 0 ? (
				hasFilters ? (
					<p className="text-stone-500">
						No recipes match your filters.{" "}
						<button
							type="button"
							onClick={clearFilters}
							className="text-stone-800 underline underline-offset-2 cursor-pointer"
						>
							Clear filters
						</button>
					</p>
				) : (
					<p className="text-stone-500">
						No recipes yet.{" "}
						<Link
							to="/recipes/new"
							className="text-stone-800 underline underline-offset-2"
						>
							Add your first one.
						</Link>
					</p>
				)
			) : (
				<div className="space-y-2">
					{recipes.map((recipe) => (
						<Link
							key={recipe.id}
							to="/recipes/$recipeId"
							params={{ recipeId: recipe.id }}
							className="flex items-start justify-between gap-4 p-4 bg-white border border-stone-200 hover:border-stone-400 transition-colors"
						>
							<div>
								<h2 className="font-semibold text-stone-900">{recipe.title}</h2>
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
							<div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
								{recipe.totalTime != null && (
									<span className="text-xs text-stone-500">
										{formatTotalTime(recipe.totalTime)}
									</span>
								)}
								<span className="text-xs text-stone-400 whitespace-nowrap">
									{recipe._count.notes}{" "}
									{recipe._count.notes === 1 ? "note" : "notes"}
								</span>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
