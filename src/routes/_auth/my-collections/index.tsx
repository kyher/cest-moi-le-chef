import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	createCollection,
	deleteCollection,
	getCollections,
} from "#/lib/collection-fns";

export const Route = createFileRoute("/_auth/my-collections/")({
	loader: () => getCollections(),
	component: MyCollectionsPage,
});

function MyCollectionsPage() {
	const loaderCollections = Route.useLoaderData();
	const { t } = useTranslation();
	const [collections, setCollections] = useState(loaderCollections);
	const [creating, setCreating] = useState(false);
	const [newName, setNewName] = useState("");
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		const name = newName.trim();
		if (!name) return;
		const created = await createCollection({ data: { name } });
		setCollections((prev) => [...prev, created]);
		setNewName("");
		setCreating(false);
	}

	async function handleDelete(collectionId: string) {
		await deleteCollection({ data: { collectionId } });
		setCollections((prev) => prev.filter((c) => c.id !== collectionId));
		setConfirmDeleteId(null);
	}

	return (
		<div className="py-10">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold font-serif text-stone-900">
					{t("myCollections.title")}
				</h1>
				{!creating && (
					<button
						type="button"
						onClick={() => {
							setCreating(true);
							setTimeout(() => inputRef.current?.focus(), 0);
						}}
						className="h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors"
					>
						{t("myCollections.new")}
					</button>
				)}
			</div>

			{creating && (
				<form onSubmit={handleCreate} className="mb-6 flex gap-2">
					<input
						ref={inputRef}
						type="text"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder={t("myCollections.namePlaceholder")}
						className="flex-1 h-9 px-3 text-sm border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-500"
					/>
					<button
						type="submit"
						disabled={!newName.trim()}
						className="h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors disabled:opacity-40"
					>
						{t("myCollections.create")}
					</button>
					<button
						type="button"
						onClick={() => {
							setCreating(false);
							setNewName("");
						}}
						className="h-9 px-4 text-sm text-stone-600 hover:text-stone-900 transition-colors"
					>
						{t("common.cancel")}
					</button>
				</form>
			)}

			{collections.length === 0 && !creating ? (
				<p className="text-stone-500">{t("myCollections.empty")}</p>
			) : (
				<div className="space-y-2">
					{collections.map((collection) => (
						<div
							key={collection.id}
							className="relative flex items-center justify-between gap-4 p-5 bg-stone-50 border border-stone-200 border-l-2 border-l-amber-300 hover:border-l-amber-500 transition-colors"
						>
							<Link
								to="/my-collections/$collectionId"
								params={{ collectionId: collection.id }}
								className="absolute inset-0"
								aria-label={collection.name}
							/>
							<div>
								<h2 className="font-semibold font-serif text-stone-900">
									{collection.name}
								</h2>
								<p className="text-xs text-stone-400 mt-0.5">
									{t("myCollections.recipes", {
										count: collection._count.entries,
									})}
								</p>
							</div>
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault();
									setConfirmDeleteId(collection.id);
								}}
								className="relative z-10 text-xs text-stone-400 hover:text-red-600 transition-colors"
							>
								{t("myCollections.delete")}
							</button>
						</div>
					))}
				</div>
			)}

			{confirmDeleteId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<button
						type="button"
						onClick={() => setConfirmDeleteId(null)}
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
							{t("myCollections.deleteConfirm")}
						</p>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setConfirmDeleteId(null)}
								className="h-9 px-4 text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("common.cancel")}
							</button>
							<button
								type="button"
								onClick={() => handleDelete(confirmDeleteId)}
								className="h-9 px-4 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors rounded-sm"
							>
								{t("myCollections.delete")}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
