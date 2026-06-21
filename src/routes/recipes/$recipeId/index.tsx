import {
	createFileRoute,
	Link,
	notFound,
	useRouter,
} from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "#/components/-site-header";
import { formatTotalTime } from "#/lib/format";
import {
	addNote,
	deleteNote,
	deleteRecipe,
	getRecipe,
	toggleLike,
} from "#/lib/recipe-fns";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/recipes/$recipeId/")({
	loader: async ({ params }) => {
		const [session, recipe] = await Promise.all([
			getSession(),
			getRecipe({ data: { recipeId: params.recipeId } }),
		]);
		if (!recipe) throw notFound();
		return { session, recipe };
	},
	head: ({ loaderData }) => {
		const recipe = loaderData?.recipe;
		if (!recipe) return {};
		const description = recipe.ingredients
			? recipe.ingredients.slice(0, 160).trimEnd()
			: `A recipe by ${recipe.user.name}`;
		return {
			meta: [
				{ title: `${recipe.title} — C'est Moi Le Chef` },
				{ name: "description", content: description },
				{ property: "og:title", content: recipe.title },
				{ property: "og:description", content: description },
				{ property: "og:type", content: "article" },
				...(recipe.imageUrl
					? [
							{ property: "og:image", content: recipe.imageUrl },
							{ name: "twitter:card", content: "summary_large_image" },
							{ name: "twitter:image", content: recipe.imageUrl },
						]
					: [{ name: "twitter:card", content: "summary" }]),
				{ name: "twitter:title", content: recipe.title },
				{ name: "twitter:description", content: description },
			],
		};
	},
	notFoundComponent: () => (
		<div className="min-h-screen flex flex-col">
			<div className="p-8 text-stone-500">Recipe not found.</div>
		</div>
	),
	component: RecipeDetail,
});

function RecipeDetail() {
	const { session, recipe } = Route.useLoaderData();
	return (
		<div className="min-h-screen flex flex-col">
			<SiteHeader user={session?.user ?? null} />
			<div className="w-3/4 mx-auto">
				<Detail recipe={recipe} isOwner={recipe.isOwner} />
			</div>
		</div>
	);
}

type Recipe = NonNullable<Awaited<ReturnType<typeof getRecipe>>>;

function Detail({ recipe, isOwner }: { recipe: Recipe; isOwner: boolean }) {
	const router = useRouter();
	const [noteBody, setNoteBody] = useState("");
	const [addingNote, setAddingNote] = useState(false);
	const [likeCount, setLikeCount] = useState(recipe.likeCount);
	const [viewerHasLiked, setViewerHasLiked] = useState(recipe.viewerHasLiked);

	async function handleToggleLike() {
		const liked = await toggleLike({ data: { recipeId: recipe.id } });
		setViewerHasLiked(liked);
		setLikeCount((c) => c + (liked ? 1 : -1));
	}

	async function handleAddNote(e: React.FormEvent) {
		e.preventDefault();
		if (!noteBody.trim()) return;
		setAddingNote(true);
		await addNote({ data: { recipeId: recipe.id, body: noteBody.trim() } });
		setNoteBody("");
		setAddingNote(false);
		toast("Note added");
		await router.invalidate();
	}

	async function handleDeleteNote(noteId: string) {
		await deleteNote({ data: { noteId } });
		toast("Note deleted");
		await router.invalidate();
	}

	async function handleDeleteRecipe() {
		if (!confirm("Delete this recipe? This cannot be undone.")) return;
		await deleteRecipe({ data: { recipeId: recipe.id } });
		toast("Recipe deleted");
		await router.navigate({ to: "/my-recipes", search: {} });
	}

	return (
		<div className="py-10">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
				<Link
					to={isOwner ? "/my-recipes" : "/"}
					search={{}}
					className="text-sm text-stone-500 hover:text-stone-800"
				>
					{isOwner ? "← My Recipes" : "← Recipes"}
				</Link>
				{isOwner && (
					<div className="flex gap-2">
						<Link
							to="/recipes/$recipeId/edit"
							params={{ recipeId: recipe.id }}
							className="h-8 px-3 text-sm font-medium rounded-sm border border-stone-300 text-stone-700 hover:border-stone-500 transition-colors flex items-center"
						>
							Edit
						</Link>
						<button
							type="button"
							onClick={handleDeleteRecipe}
							className="h-8 px-3 text-sm font-medium rounded-sm border border-red-200 text-red-600 hover:border-red-400 transition-colors"
						>
							Delete
						</button>
					</div>
				)}
			</div>

			{recipe.imageUrl && (
				<img
					src={recipe.imageUrl}
					alt={recipe.title}
					className="w-full max-w-2xl aspect-video object-cover rounded-sm border border-stone-200 mb-6"
				/>
			)}

			<h1 className="text-3xl font-bold font-serif text-stone-900 mb-1">
				{recipe.title}
			</h1>
			{!isOwner && (
				<p className="text-sm text-stone-400 mb-3">
					by{" "}
					<Link
						to="/profile/$username"
						params={{ username: recipe.user.username }}
						className="hover:text-stone-600 hover:underline underline-offset-2"
					>
						{recipe.user.name}
					</Link>
				</p>
			)}

			<div className="flex items-center gap-2 mb-4">
				{viewerHasLiked !== null && (
					<button
						type="button"
						onClick={handleToggleLike}
						className={`h-8 px-3 text-sm font-medium rounded-sm border transition-colors ${
							viewerHasLiked
								? "bg-amber-50 border-amber-300 text-amber-700 hover:border-amber-400"
								: "border-stone-300 text-stone-600 hover:border-stone-500"
						}`}
					>
						{viewerHasLiked ? "♥ Liked" : "♡ Like"}
					</button>
				)}
				{likeCount > 0 && (
					<span className="text-sm text-stone-400">
						{likeCount} {likeCount === 1 ? "like" : "likes"}
					</span>
				)}
				{recipe.isPublic && (
					<button
						type="button"
						onClick={() => {
							navigator.clipboard.writeText(window.location.href);
							toast("Link copied!");
						}}
						className="h-8 px-3 text-sm font-medium rounded-sm border border-stone-300 text-stone-600 hover:border-stone-500 transition-colors"
					>
						Copy link
					</button>
				)}
			</div>

			{recipe.tags.length > 0 && (
				<div className="flex flex-wrap gap-1 mb-6">
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

			{(recipe.totalTime != null || recipe.servings != null) && (
				<div className="flex items-center gap-4 mb-6">
					{recipe.totalTime != null && (
						<p className="text-sm text-stone-500">
							{formatTotalTime(recipe.totalTime)}
						</p>
					)}
					{recipe.servings != null && (
						<p className="text-sm text-stone-500">Serves {recipe.servings}</p>
					)}
				</div>
			)}

			{recipe.ingredients && (
				<section className="mb-6">
					<h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
						Ingredients
					</h2>
					<p className="text-sm text-stone-800 whitespace-pre-wrap">
						{recipe.ingredients}
					</p>
				</section>
			)}

			{recipe.method && (
				<section className="mb-8">
					<h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
						Method
					</h2>
					<p className="text-sm text-stone-800 whitespace-pre-wrap">
						{recipe.method}
					</p>
				</section>
			)}

			{(isOwner || recipe.viewerHasLiked !== null) && (
				<section>
					<div className="flex items-baseline gap-2 mb-4">
						<h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
							Notes
							{recipe.notes.length > 0 ? ` (${recipe.notes.length})` : ""}
						</h2>
						{!isOwner && (
							<span className="text-xs text-stone-400">
								· only visible to you
							</span>
						)}
					</div>

					<form onSubmit={handleAddNote} className="flex flex-col gap-2 mb-6">
						<textarea
							value={noteBody}
							onChange={(e) => setNoteBody(e.target.value)}
							placeholder="Add a note…"
							rows={2}
							className="w-full px-3 py-2 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none"
						/>
						<button
							type="submit"
							disabled={addingNote || !noteBody.trim()}
							className="self-end h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-50 transition-colors"
						>
							Add
						</button>
					</form>

					{recipe.notes.length === 0 ? (
						<p className="text-sm text-stone-400">No notes yet.</p>
					) : (
						<div className="space-y-3">
							{recipe.notes.map((note) => (
								<div
									key={note.id}
									className="flex items-center gap-3 group p-3 bg-amber-50 border border-amber-100"
								>
									<div className="flex-1">
										<p className="text-xs text-stone-400 mb-1">
											{new Date(note.createdAt).toLocaleDateString("en-GB", {
												day: "numeric",
												month: "short",
												year: "numeric",
											})}
										</p>
										<p className="text-sm text-stone-800 whitespace-pre-wrap">
											{note.body}
										</p>
									</div>
									<button
										type="button"
										onClick={() => handleDeleteNote(note.id)}
										className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
									>
										<Trash2 size={14} />
									</button>
								</div>
							))}
						</div>
					)}
				</section>
			)}
		</div>
	);
}
