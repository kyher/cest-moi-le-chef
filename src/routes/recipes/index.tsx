import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RecipeFilterPanel } from "#/components/-recipe-filter-panel";
import { SiteHeader } from "#/components/-site-header";
import { formatTotalTime } from "#/lib/format";
import { useRecipeFilters, validateRecipeSearch } from "#/lib/recipe-filters";
import {
	getPublicRecipes,
	getPublicTagsInUse,
	toggleLike,
} from "#/lib/recipe-fns";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/recipes/")({
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
	component: RecipesPage,
});

type Recipe = Awaited<ReturnType<typeof getPublicRecipes>>[number];

function RecipeCard({
	recipe,
	viewerId,
}: {
	recipe: Recipe;
	viewerId: string | null;
}) {
	const { t } = useTranslation();
	const isOwner = viewerId !== null && recipe.userId === viewerId;
	const [likeCount, setLikeCount] = useState(recipe._count.likes);
	const [viewerHasLiked, setViewerHasLiked] = useState(
		recipe.likes && recipe.likes.length > 0,
	);

	async function handleToggleLike(e: React.MouseEvent) {
		e.preventDefault();
		const liked = await toggleLike({ data: { recipeId: recipe.id } });
		setViewerHasLiked(liked);
		setLikeCount((c) => c + (liked ? 1 : -1));
	}

	return (
		<div className="relative flex flex-col bg-stone-50 border border-stone-200 border-l-2 border-l-amber-300 hover:border-l-amber-500 transition-colors">
			<Link
				to="/recipes/$recipeId"
				params={{ recipeId: recipe.id }}
				className="absolute inset-0"
				aria-label={recipe.title}
			/>
			{recipe.imageUrl ? (
				<img
					src={recipe.imageUrl}
					alt=""
					className="h-32 w-full object-cover border-b border-stone-200"
				/>
			) : (
				<div className="h-32 w-full bg-stone-100 border-b border-stone-200 flex items-center justify-center">
					<UtensilsCrossed className="text-stone-300" size={32} />
				</div>
			)}
			<div className="flex flex-col flex-1 p-3 gap-2">
				<h2 className="font-semibold font-serif text-stone-900">
					{recipe.title}
				</h2>
				<Link
					to="/profile/$username"
					params={{ username: recipe.user.username }}
					className="relative text-xs text-stone-400 hover:text-stone-600 hover:underline underline-offset-2"
				>
					{t("common.by", { name: recipe.user.name })}
				</Link>
				{recipe.tags.length > 0 && (
					<div className="flex flex-wrap gap-1">
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
				<div className="relative flex items-center justify-between mt-auto pt-2">
					{recipe.totalTime != null ? (
						<span className="text-xs text-stone-500">
							{formatTotalTime(recipe.totalTime)}
						</span>
					) : (
						<span />
					)}
					{viewerId !== null && !isOwner ? (
						<button
							type="button"
							onClick={handleToggleLike}
							className={`h-7 px-2 text-xs font-medium rounded-sm border transition-colors ${
								viewerHasLiked
									? "bg-amber-50 border-amber-300 text-amber-700 hover:border-amber-400"
									: "border-stone-300 text-stone-500 hover:border-stone-500"
							}`}
						>
							{viewerHasLiked ? "♥" : "♡"}
							{likeCount > 0 ? ` ${likeCount}` : ""}
						</button>
					) : (
						likeCount > 0 && (
							<span className="text-xs text-stone-400">♥ {likeCount}</span>
						)
					)}
				</div>
			</div>
		</div>
	);
}

function RecipesPage() {
	const { session, recipes, tagsInUse } = Route.useLoaderData();
	const { t } = useTranslation();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const filters = useRecipeFilters(search, navigate);
	const showFilters = recipes.length > 0 || filters.hasConstraints;

	return (
		<div className="min-h-screen flex flex-col">
			<SiteHeader user={session?.user ?? null} />
			<div className="w-3/4 mx-auto py-10">
				<h1 className="text-3xl font-bold font-serif text-stone-900 mb-8">
					{t("recipes.title")}
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
								{t("recipes.noMatch")}{" "}
								<button
									type="button"
									onClick={filters.reset}
									className="text-stone-800 underline underline-offset-2 cursor-pointer"
								>
									{t("common.reset")}
								</button>
							</>
						) : (
							t("recipes.empty")
						)}
					</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{recipes.map((recipe) => (
							<RecipeCard
								key={recipe.id}
								recipe={recipe}
								viewerId={session?.user.id ?? null}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
