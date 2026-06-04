import {
	createFileRoute,
	Link,
	notFound,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "#/components/-site-header";
import { toast } from "sonner";
import { getRecipe, updateRecipe } from "#/lib/recipes";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/recipes/$recipeId/edit")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) throw redirect({ to: "/sign-in" });
		return { session };
	},
	loader: async ({ params, context }) => {
		const recipe = await getRecipe({ data: { recipeId: params.recipeId } });
		if (!recipe || !recipe.isOwner) throw notFound();
		return { recipe, session: context.session };
	},
	notFoundComponent: () => (
		<div className="min-h-screen flex flex-col">
			<div className="p-8 text-stone-500">Recipe not found.</div>
		</div>
	),
	component: EditRecipe,
});

function EditRecipe() {
	const { recipe, session } = Route.useLoaderData();
	return (
		<div className="min-h-screen flex flex-col">
			<SiteHeader user={session.user} />
			<div className="w-3/4 mx-auto">
				<EditForm recipe={recipe} />
			</div>
		</div>
	);
}

type Recipe = NonNullable<Awaited<ReturnType<typeof getRecipe>>>;

function EditForm({ recipe }: { recipe: Recipe }) {
	const router = useRouter();
	const initialTags = recipe.tags.map(({ tag }) => tag.name);

	const [title, setTitle] = useState(recipe.title);
	const [ingredients, setIngredients] = useState(recipe.ingredients ?? "");
	const [method, setMethod] = useState(recipe.method ?? "");
	const [hours, setHours] = useState(
		recipe.totalTime ? String(Math.floor(recipe.totalTime / 60)) : "",
	);
	const [minutes, setMinutes] = useState(
		recipe.totalTime ? String(recipe.totalTime % 60) : "",
	);
	const [tags, setTags] = useState<string[]>(initialTags);
	const [tagInput, setTagInput] = useState("");
	const [isPublic, setIsPublic] = useState(recipe.isPublic);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");

	function addTag(value: string) {
		const name = value.toLowerCase().trim();
		if (name && !tags.includes(name)) setTags([...tags, name]);
		setTagInput("");
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		setPending(true);
		setError("");
		try {
			const h = parseInt(hours, 10) || 0;
			const m = parseInt(minutes, 10) || 0;
			const totalTime = h * 60 + m || undefined;
			await updateRecipe({
				data: {
					recipeId: recipe.id,
					title: title.trim(),
					ingredients: ingredients || undefined,
					method: method || undefined,
					totalTime,
					isPublic,
					tags,
				},
			});
			toast("Recipe saved");
			await router.navigate({
				to: "/recipes/$recipeId",
				params: { recipeId: recipe.id },
			});
		} catch {
			setError("Failed to save changes.");
			setPending(false);
		}
	}

	return (
		<div className="py-10">
			<Link
				to="/recipes/$recipeId"
				params={{ recipeId: recipe.id }}
				className="text-sm text-stone-500 hover:text-stone-800 mb-6 inline-block"
			>
				← {recipe.title}
			</Link>
			<h1 className="text-3xl font-bold text-stone-900 mb-8">Edit Recipe</h1>

			<form onSubmit={handleSubmit} className="space-y-6">
				{error && <p className="text-sm text-red-600">{error}</p>}

				<div className="space-y-1">
					<label htmlFor="title" className="text-sm font-medium text-stone-700">
						Title <span className="text-red-500">*</span>
					</label>
					<input
						id="title"
						type="text"
						required
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full h-9 px-3 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
					/>
				</div>

				<div className="space-y-1">
					<label
						htmlFor="tag-input"
						className="text-sm font-medium text-stone-700"
					>
						Tags
					</label>
					{tags.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-2">
							{tags.map((tag) => (
								<span
									key={tag}
									className="flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-50 text-stone-700 border border-amber-200"
								>
									{tag}
									<button
										type="button"
										onClick={() => setTags(tags.filter((t) => t !== tag))}
										className="text-stone-400 hover:text-stone-700 leading-none"
									>
										×
									</button>
								</span>
							))}
						</div>
					)}
					<input
						type="text"
						value={tagInput}
						onChange={(e) => setTagInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === ",") {
								e.preventDefault();
								addTag(tagInput);
							}
						}}
						onBlur={() => tagInput && addTag(tagInput)}
						id="tag-input"
						placeholder="Type a tag and press Enter"
						className="w-full h-9 px-3 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
					/>
				</div>

				<div className="space-y-1">
					<label
						htmlFor="total-time-hours"
						className="text-sm font-medium text-stone-700"
					>
						Total Time
					</label>
					<div className="flex items-center gap-2">
						<input
							id="total-time-hours"
							type="number"
							min="0"
							value={hours}
							onChange={(e) => setHours(e.target.value)}
							placeholder="0"
							className="w-20 h-9 px-3 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
						/>
						<span className="text-sm text-stone-500">hr</span>
						<input
							type="number"
							min="0"
							max="59"
							value={minutes}
							onChange={(e) => setMinutes(e.target.value)}
							placeholder="0"
							className="w-20 h-9 px-3 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
						/>
						<span className="text-sm text-stone-500">min</span>
					</div>
				</div>

				<div className="space-y-1">
					<label
						htmlFor="ingredients"
						className="text-sm font-medium text-stone-700"
					>
						Ingredients
					</label>
					<textarea
						id="ingredients"
						value={ingredients}
						onChange={(e) => setIngredients(e.target.value)}
						rows={6}
						className="w-full px-3 py-2 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-y"
					/>
				</div>

				<div className="space-y-1">
					<label htmlFor="method" className="text-sm font-medium text-stone-700">
						Method
					</label>
					<textarea
						id="method"
						value={method}
						onChange={(e) => setMethod(e.target.value)}
						rows={8}
						className="w-full px-3 py-2 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-y"
					/>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						role="switch"
						aria-checked={isPublic}
						onClick={() => setIsPublic(!isPublic)}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
							isPublic ? "bg-amber-500" : "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
								isPublic ? "translate-x-4.5" : "translate-x-0.5"
							}`}
						/>
					</button>
					<span className="text-sm text-stone-700">
						{isPublic
							? "Public — visible to everyone"
							: "Private — only visible to you"}
					</span>
				</div>

				<button
					type="submit"
					disabled={pending}
					className="h-9 px-6 text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-50 transition-colors"
				>
					{pending ? "Saving…" : "Save Changes"}
				</button>
			</form>
		</div>
	);
}
