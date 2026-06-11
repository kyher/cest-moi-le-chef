import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "#/components/-site-header";
import { formatTotalTime } from "#/lib/format";
import { getProfile } from "#/lib/recipe-fns";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/profile/$username")({
	loader: async ({ params }) => {
		const [session, profile] = await Promise.all([
			getSession(),
			getProfile({ data: { username: params.username } }),
		]);
		if (!profile) throw notFound();
		return { session, profile };
	},
	notFoundComponent: () => (
		<div className="min-h-screen flex flex-col">
			<div className="p-8 text-stone-500">Profile not found.</div>
		</div>
	),
	component: ProfilePage,
});

function ProfilePage() {
	const { session, profile } = Route.useLoaderData();

	return (
		<div className="min-h-screen flex flex-col">
			<SiteHeader user={session?.user ?? null} />
			<div className="w-3/4 mx-auto py-10">
				<div className="mb-8">
					<h1 className="text-3xl font-bold font-serif text-stone-900">
						{profile.name}
					</h1>
					<p className="text-sm text-stone-400 mt-1">@{profile.username}</p>
				</div>

				{profile.recipes.length === 0 ? (
					<p className="text-stone-500">No public recipes yet.</p>
				) : (
					<div className="space-y-2">
						{profile.recipes.map((recipe) => (
							<Link
								key={recipe.id}
								to="/recipes/$recipeId"
								params={{ recipeId: recipe.id }}
								className="flex items-start justify-between gap-4 p-5 bg-stone-50 border border-stone-200 border-l-2 border-l-amber-300 hover:border-l-amber-500 transition-colors"
							>
								<div className="flex items-start gap-4 flex-1 min-w-0">
									{recipe.imageUrl && (
										<img
											src={recipe.imageUrl}
											alt=""
											className="w-16 h-16 object-cover rounded-sm shrink-0 border border-stone-200"
										/>
									)}
									<div className="min-w-0">
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
									</div>
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
