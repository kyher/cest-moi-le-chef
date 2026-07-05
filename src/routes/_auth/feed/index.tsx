import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { formatTotalTime } from "#/lib/format";
import { getFeed } from "#/lib/recipe-fns";

export const Route = createFileRoute("/_auth/feed/")({
	loader: () => getFeed(),
	component: FeedPage,
});

function FeedPage() {
	const { recipes, followingCount } = Route.useLoaderData();
	const { t } = useTranslation();

	return (
		<div className="py-10">
			<h1 className="text-3xl font-bold font-serif text-stone-900 mb-8">
				{t("feed.title")}
			</h1>

			{recipes.length === 0 ? (
				<p className="text-stone-500">
					{followingCount === 0 ? (
						<>
							{t("feed.emptyNotFollowing")}{" "}
							<Link
								to="/recipes"
								className="text-stone-800 underline underline-offset-2"
							>
								{t("feed.browse")}
							</Link>
						</>
					) : (
						t("feed.emptyNoRecipes")
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
										{t("common.by", { name: recipe.user.name })}
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
								{recipe.difficulty != null && (
									<span className="text-xs text-stone-500">
										{t(`difficulty.${recipe.difficulty}`)}
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
