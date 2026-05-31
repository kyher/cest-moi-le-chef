import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getRecipes, getTagsInUse } from "#/lib/recipes";
import { RecipeFilters } from "./_components/-recipe-filters";
import { RecipeList } from "./_components/-recipe-list";
import { RecipeSearch } from "./_components/-recipe-search";

export const Route = createFileRoute("/_auth/recipes/")({
	validateSearch: (
		search: Record<string, unknown>,
	): { tags?: string; maxTime?: number; q?: string } => {
		const tags =
			typeof search.tags === "string" && search.tags ? search.tags : undefined;
		const maxTimeRaw = Number(search.maxTime);
		const maxTime =
			search.maxTime != null &&
			search.maxTime !== "" &&
			!Number.isNaN(maxTimeRaw)
				? maxTimeRaw
				: undefined;
		const q = typeof search.q === "string" && search.q ? search.q : undefined;
		return { tags, maxTime, q };
	},
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) =>
		Promise.all([getRecipes({ data: deps }), getTagsInUse()]).then(
			([recipes, tagsInUse]) => ({ recipes, tagsInUse }),
		),
	component: RecipesPage,
});

function RecipesPage() {
	const { recipes, tagsInUse } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const activeTags = search.tags?.split(",").filter(Boolean) ?? [];
	const activeMaxTime = search.maxTime;
	const activeQ = search.q;
	const hasConstraints =
		activeTags.length > 0 || activeMaxTime != null || activeQ != null;
	const showFilters = recipes.length > 0 || hasConstraints;

	const [searchInput, setSearchInput] = useState(activeQ ?? "");

	useEffect(() => {
		const timer = setTimeout(() => {
			navigate({
				search: (prev) => ({
					...prev,
					q: searchInput || undefined,
				}),
			});
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput, navigate]);

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

	function reset() {
		setSearchInput("");
		navigate({ search: { tags: undefined, maxTime: undefined, q: undefined } });
	}

	return (
		<div className="py-10">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<h1 className="text-3xl font-bold text-stone-900">My Recipes</h1>
				<Link
					to="/recipes/new"
					className="h-9 px-4 text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center self-start sm:self-auto"
				>
					+ New Recipe
				</Link>
			</div>

			{showFilters && (
				<RecipeSearch value={searchInput} onChange={setSearchInput} />
			)}

			{showFilters && (
				<RecipeFilters
					tagsInUse={tagsInUse}
					activeTags={activeTags}
					activeMaxTime={activeMaxTime}
					onToggleTag={toggleTag}
					onToggleMaxTime={toggleMaxTime}
				/>
			)}

			{hasConstraints && (
				<button
					type="button"
					onClick={reset}
					className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700 transition-colors cursor-pointer mb-6"
				>
					Reset
				</button>
			)}

			<RecipeList
				recipes={recipes}
				hasConstraints={hasConstraints}
				onReset={reset}
			/>
		</div>
	);
}
