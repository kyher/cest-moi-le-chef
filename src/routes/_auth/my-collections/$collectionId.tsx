import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RecipePicker } from "#/components/-recipe-picker";
import { formatTotalTime } from "#/lib/format";
import {
	addCollectionEntry,
	getCollection,
	removeCollectionEntry,
	renameCollection,
} from "#/lib/collection-fns";
import { getWeeklyPlanRecipeOptions } from "#/lib/weekly-plan-fns";

export const Route = createFileRoute("/_auth/my-collections/$collectionId")({
	loader: async ({ params }) => {
		const [collection, recipeOptions] = await Promise.all([
			getCollection({ data: { collectionId: params.collectionId } }),
			getWeeklyPlanRecipeOptions(),
		]);
		if (!collection) throw redirect({ to: "/my-collections" });
		return { collection, recipeOptions };
	},
	component: CollectionDetailPage,
});

function CollectionDetailPage() {
	const { collection: loaderCollection, recipeOptions } =
		Route.useLoaderData();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [collection, setCollection] = useState(loaderCollection);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [editingName, setEditingName] = useState(false);
	const [nameInput, setNameInput] = useState(collection.name);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const nameInputRef = useRef<HTMLInputElement>(null);

	const collectionRecipeIds = new Set(collection.entries.map((e) => e.recipeId));

	async function handleAdd(recipeId: string) {
		setPickerOpen(false);
		const entry = await addCollectionEntry({
			data: { collectionId: collection.id, recipeId },
		});
		setCollection((prev) => ({
			...prev,
			entries: [...prev.entries, entry],
		}));
	}

	async function handleRemove(recipeId: string) {
		await removeCollectionEntry({
			data: { collectionId: collection.id, recipeId },
		});
		setCollection((prev) => ({
			...prev,
			entries: prev.entries.filter((e) => e.recipeId !== recipeId),
		}));
	}

	async function handleRename(e: React.FormEvent) {
		e.preventDefault();
		const name = nameInput.trim();
		if (!name || name === collection.name) {
			setEditingName(false);
			setNameInput(collection.name);
			return;
		}
		await renameCollection({ data: { collectionId: collection.id, name } });
		setCollection((prev) => ({ ...prev, name }));
		setEditingName(false);
	}

	async function handleDelete() {
		const { deleteCollection } = await import("#/lib/collection-fns");
		await deleteCollection({ data: { collectionId: collection.id } });
		navigate({ to: "/my-collections" });
	}

	const excludeIds = collectionRecipeIds;

	return (
		<div className="py-10">
			<Link
				to="/my-collections"
				className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
			>
				{t("collection.backToCollections")}
			</Link>

			<div className="flex items-start justify-between gap-4 mt-6 mb-8">
				{editingName ? (
					<form onSubmit={handleRename} className="flex gap-2 flex-1">
						<input
							ref={nameInputRef}
							type="text"
							value={nameInput}
							onChange={(e) => setNameInput(e.target.value)}
							className="flex-1 h-9 px-3 text-sm border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-stone-500"
							autoFocus
						/>
						<button
							type="submit"
							className="h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors"
						>
							{t("collection.save")}
						</button>
						<button
							type="button"
							onClick={() => {
								setEditingName(false);
								setNameInput(collection.name);
							}}
							className="h-9 px-4 text-sm text-stone-600 hover:text-stone-900 transition-colors"
						>
							{t("common.cancel")}
						</button>
					</form>
				) : (
					<h1 className="text-3xl font-bold font-serif text-stone-900">
						{collection.name}
					</h1>
				)}

				{!editingName && (
					<div className="flex gap-2 shrink-0 mt-1">
						<button
							type="button"
							onClick={() => setPickerOpen(true)}
							className="h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors"
						>
							{t("collection.addRecipe")}
						</button>
						<button
							type="button"
							onClick={() => setEditingName(true)}
							className="h-9 px-4 text-sm text-stone-600 hover:text-stone-900 border border-stone-300 hover:border-stone-400 transition-colors rounded-sm"
						>
							{t("collection.rename")}
						</button>
						<button
							type="button"
							onClick={() => setConfirmDelete(true)}
							className="h-9 px-4 text-sm text-stone-500 hover:text-red-600 border border-stone-300 hover:border-red-300 transition-colors rounded-sm"
						>
							{t("collection.delete")}
						</button>
					</div>
				)}
			</div>

			{collection.entries.length === 0 ? (
				<p className="text-stone-500">{t("collection.empty")}</p>
			) : (
				<div className="space-y-2">
					{collection.entries.map((entry) => (
						<div
							key={entry.recipeId}
							className="relative flex items-start justify-between gap-4 p-5 bg-stone-50 border border-stone-200 border-l-2 border-l-amber-300 hover:border-l-amber-500 transition-colors"
						>
							<Link
								to="/recipes/$recipeId"
								params={{ recipeId: entry.recipeId }}
								className="absolute inset-0"
								aria-label={entry.recipe.title}
							/>
							<div className="flex items-start gap-4 flex-1 min-w-0">
								{entry.recipe.imageUrl && (
									<img
										src={entry.recipe.imageUrl}
										alt=""
										className="relative w-16 h-16 object-cover rounded-sm shrink-0 border border-stone-200"
									/>
								)}
								<div className="relative min-w-0">
									<h2 className="font-semibold font-serif text-stone-900">
										{entry.recipe.title}
									</h2>
									{entry.recipe.userId !== collection.userId && (
										<Link
											to="/profile/$username"
											params={{ username: entry.recipe.user.username }}
											className="text-xs text-stone-400 mt-0.5 hover:text-stone-600 hover:underline underline-offset-2"
										>
											{t("common.by", { name: entry.recipe.user.name })}
										</Link>
									)}
									{entry.recipe.tags.length > 0 && (
										<div className="flex flex-wrap gap-1 mt-2">
											{entry.recipe.tags.map(({ tag }) => (
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
							<div className="relative flex items-center gap-3 shrink-0 mt-0.5">
								{entry.recipe.totalTime != null && (
									<span className="text-xs text-stone-500">
										{formatTotalTime(entry.recipe.totalTime)}
									</span>
								)}
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										handleRemove(entry.recipeId);
									}}
									className="text-xs text-stone-400 hover:text-red-600 transition-colors"
								>
									{t("collection.remove")}
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{pickerOpen && (
				<RecipePicker
					title={t("recipePicker.addTo", { name: collection.name })}
					ownRecipes={recipeOptions.ownRecipes}
					likedRecipes={recipeOptions.likedRecipes}
					allRecipes={recipeOptions.allRecipes}
					excludeIds={excludeIds}
					onAdd={handleAdd}
					onClose={() => setPickerOpen(false)}
				/>
			)}

			{confirmDelete && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<button
						type="button"
						onClick={() => setConfirmDelete(false)}
						className="absolute inset-0 bg-black/40"
						aria-label="Close"
						tabIndex={-1}
					/>
					<div
						role="dialog"
						aria-modal="true"
						className="relative z-10 bg-white w-full max-w-sm shadow-lg p-6"
					>
						<p className="text-sm text-stone-700 mb-6">
							{t("collection.deleteConfirm")}
						</p>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setConfirmDelete(false)}
								className="h-9 px-4 text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("common.cancel")}
							</button>
							<button
								type="button"
								onClick={handleDelete}
								className="h-9 px-4 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors rounded-sm"
							>
								{t("collection.delete")}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
