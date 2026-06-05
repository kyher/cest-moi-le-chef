import { Link } from "@tanstack/react-router";
import { formatTotalTime } from "#/lib/format";
import type { getRecipes } from "#/lib/recipes";

type Recipe = Awaited<ReturnType<typeof getRecipes>>[number];

interface Props {
	recipes: Recipe[];
	hasConstraints: boolean;
	onReset: () => void;
}

export function RecipeList({ recipes, hasConstraints, onReset }: Props) {
	if (recipes.length === 0) {
		return hasConstraints ? (
			<p className="text-stone-500">
				No recipes match your filters.{" "}
				<button
					type="button"
					onClick={onReset}
					className="text-stone-800 underline underline-offset-2 cursor-pointer"
				>
					Reset
				</button>
			</p>
		) : (
			<p className="text-stone-500">
				No recipes yet.{" "}
				<Link
					to="/my-recipes/new"
					className="text-stone-800 underline underline-offset-2"
				>
					Add your first one.
				</Link>
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{recipes.map((recipe) => (
				<div
					key={recipe.id}
					className="flex items-start justify-between gap-4 p-5 bg-stone-50 border border-stone-200 border-l-2 border-l-amber-300 hover:border-l-amber-500 transition-colors"
				>
					<Link
						to="/recipes/$recipeId"
						params={{ recipeId: recipe.id }}
						className="flex-1 min-w-0"
					>
						<h2 className="font-semibold font-serif text-stone-900">
							{recipe.title}
						</h2>
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
					</Link>
					<div className="flex flex-col items-end gap-2 shrink-0 mt-0.5">
						{recipe.totalTime != null && (
							<span className="text-xs text-stone-500">
								{formatTotalTime(recipe.totalTime)}
							</span>
						)}
						<span className="text-xs text-stone-400 whitespace-nowrap">
							{recipe._count.notes}{" "}
							{recipe._count.notes === 1 ? "note" : "notes"}
						</span>
						<span
							className={
								recipe.isPublic
									? "px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-300"
									: "px-2 py-0.5 text-xs text-stone-400 bg-white border border-stone-200"
							}
						>
							{recipe.isPublic ? "Public" : "Private"}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}
