import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatTotalTime } from "#/lib/format";

type Recipe = {
	id: string;
	title: string;
	imageUrl: string | null;
	totalTime: number | null;
};

type Tab = "own" | "liked" | "all";

interface Props {
	title: string;
	ownRecipes: Recipe[];
	likedRecipes: Recipe[];
	allRecipes: Recipe[];
	excludeIds?: Set<string>;
	onAdd: (recipeId: string) => void;
	onClose: () => void;
}

export function RecipePicker({
	title,
	ownRecipes,
	likedRecipes,
	allRecipes,
	excludeIds,
	onAdd,
	onClose,
}: Props) {
	const { t } = useTranslation();
	const [tab, setTab] = useState<Tab>("own");
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const q = query.toLowerCase();

	function filtered(recipes: Recipe[]) {
		return recipes.filter(
			(r) =>
				r.title.toLowerCase().includes(q) && !excludeIds?.has(r.id),
		);
	}

	const tabs: { key: Tab; label: string; recipes: Recipe[] }[] = [
		{
			key: "own",
			label: t("recipePicker.yourRecipes"),
			recipes: filtered(ownRecipes),
		},
		{
			key: "liked",
			label: t("recipePicker.likedRecipes"),
			recipes: filtered(likedRecipes),
		},
		{
			key: "all",
			label: t("recipePicker.allRecipes"),
			recipes: filtered(allRecipes),
		},
	];

	const activeRecipes = tabs.find((t) => t.key === tab)?.recipes ?? [];

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:items-center sm:pt-0">
			<button
				type="button"
				onClick={onClose}
				className="absolute inset-0 bg-black/40"
				aria-label="Close"
				tabIndex={-1}
			/>
			<div
				role="dialog"
				aria-modal="true"
				className="relative z-10 bg-white w-full max-w-md max-h-[70vh] flex flex-col shadow-lg"
			>
				<div className="px-4 pt-4 pb-0 border-b border-stone-200 shrink-0">
					<h2 className="font-semibold font-serif text-stone-900 mb-3">
						{title}
					</h2>
					<input
						ref={inputRef}
						type="search"
						placeholder={t("recipePicker.search")}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="w-full h-9 px-3 text-sm border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-500 mb-3"
					/>
					<div className="flex gap-0 -mb-px">
						{tabs.map(({ key, label }) => (
							<button
								key={key}
								type="button"
								onClick={() => setTab(key)}
								className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
									tab === key
										? "border-stone-800 text-stone-900"
										: "border-transparent text-stone-500 hover:text-stone-700"
								}`}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-y-auto flex-1">
					{activeRecipes.length === 0 ? (
						<p className="px-4 py-6 text-sm text-stone-500 text-center">
							{t("recipePicker.noResults")}
						</p>
					) : (
						activeRecipes.map((recipe) => (
							<button
								key={recipe.id}
								type="button"
								onClick={() => onAdd(recipe.id)}
								className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 border-b border-stone-100 last:border-0 transition-colors"
							>
								{recipe.imageUrl ? (
									<img
										src={recipe.imageUrl}
										alt=""
										className="w-10 h-10 object-cover rounded-sm shrink-0 border border-stone-200"
									/>
								) : (
									<div className="w-10 h-10 bg-stone-100 rounded-sm shrink-0 border border-stone-200" />
								)}
								<span className="flex-1 min-w-0">
									<span className="block text-sm font-medium text-stone-900 truncate">
										{recipe.title}
									</span>
									{recipe.totalTime != null && (
										<span className="text-xs text-stone-400">
											{formatTotalTime(recipe.totalTime)}
										</span>
									)}
								</span>
							</button>
						))
					)}
				</div>
			</div>
		</div>
	);
}
