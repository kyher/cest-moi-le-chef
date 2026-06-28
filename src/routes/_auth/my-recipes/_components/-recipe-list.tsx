import { Link } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatTotalTime } from "#/lib/format";
import type { getRecipes } from "#/lib/recipe-fns";

type Recipe = Awaited<ReturnType<typeof getRecipes>>[number];

interface Props {
	recipes: Recipe[];
	hasConstraints: boolean;
	onReset: () => void;
}

export function RecipeList({ recipes, hasConstraints, onReset }: Props) {
	const { t } = useTranslation();

	if (recipes.length === 0) {
		return hasConstraints ? (
			<p className="text-stone-500">
				{t("myRecipes.noMatch")}{" "}
				<button
					type="button"
					onClick={onReset}
					className="text-stone-800 underline underline-offset-2 cursor-pointer"
				>
					{t("common.reset")}
				</button>
			</p>
		) : (
			<p className="text-stone-500">
				{t("myRecipes.empty")}{" "}
				<Link
					to="/my-recipes/new"
					className="text-stone-800 underline underline-offset-2"
				>
					{t("myRecipes.addFirst")}
				</Link>
			</p>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			{recipes.map((recipe) => (
				<Link
					key={recipe.id}
					to="/recipes/$recipeId"
					params={{ recipeId: recipe.id }}
					className="flex flex-col bg-stone-50 border border-stone-200 border-l-2 border-l-amber-300 hover:border-l-amber-500 transition-colors"
				>
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
						<div className="flex items-center justify-between mt-auto pt-2">
							<div className="flex items-center gap-2 text-xs text-stone-400">
								{recipe.totalTime != null && (
									<span className="text-stone-500">
										{formatTotalTime(recipe.totalTime)}
									</span>
								)}
								<span>
									{t("myRecipes.note", { count: recipe._count.notes })}
								</span>
							</div>
							<span
								className={
									recipe.isPublic
										? "px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-300"
										: "px-2 py-0.5 text-xs text-stone-400 bg-white border border-stone-200"
								}
							>
								{recipe.isPublic
									? t("myRecipes.public")
									: t("myRecipes.private")}
							</span>
						</div>
					</div>
				</Link>
			))}
		</div>
	);
}
