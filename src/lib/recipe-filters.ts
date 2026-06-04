import { useEffect, useState } from "react";

export type RecipeSearchParams = {
	tags?: string;
	maxTime?: number;
	q?: string;
};

export function validateRecipeSearch(
	search: Record<string, unknown>,
): RecipeSearchParams {
	const tags =
		typeof search.tags === "string" && search.tags ? search.tags : undefined;
	const maxTimeRaw = Number(search.maxTime);
	const maxTime =
		search.maxTime != null && search.maxTime !== "" && !Number.isNaN(maxTimeRaw)
			? maxTimeRaw
			: undefined;
	const q = typeof search.q === "string" && search.q ? search.q : undefined;
	return { tags, maxTime, q };
}

type NavigateFn = (opts: {
	search:
		| RecipeSearchParams
		| ((prev: RecipeSearchParams) => RecipeSearchParams);
}) => unknown;

export function useRecipeFilters(
	search: RecipeSearchParams,
	navigate: NavigateFn,
) {
	const activeTags = search.tags?.split(",").filter(Boolean) ?? [];
	const activeMaxTime = search.maxTime;
	const activeQ = search.q;
	const hasConstraints =
		activeTags.length > 0 || activeMaxTime != null || activeQ != null;

	const [searchInput, setSearchInput] = useState(activeQ ?? "");

	useEffect(() => {
		const timer = setTimeout(() => {
			navigate({
				search: (prev) => ({ ...prev, q: searchInput || undefined }),
			});
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput, navigate]);

	function toggleTag(tagName: string) {
		const next = activeTags.includes(tagName)
			? activeTags.filter((t) => t !== tagName)
			: [...activeTags, tagName];
		navigate({
			search: (prev) => ({
				...prev,
				tags: next.length > 0 ? next.join(",") : undefined,
			}),
		});
	}

	function toggleMaxTime(minutes: number) {
		navigate({
			search: (prev) => ({
				...prev,
				maxTime: prev.maxTime === minutes ? undefined : minutes,
			}),
		});
	}

	function reset() {
		setSearchInput("");
		navigate({ search: { tags: undefined, maxTime: undefined, q: undefined } });
	}

	return {
		activeTags,
		activeMaxTime,
		activeQ,
		hasConstraints,
		searchInput,
		setSearchInput,
		toggleTag,
		toggleMaxTime,
		reset,
	};
}
