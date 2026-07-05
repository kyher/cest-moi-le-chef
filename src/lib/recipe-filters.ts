import { useEffect, useState } from "react";
import type { Difficulty } from "#/generated/prisma/enums";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export type RecipeSearchParams = {
	tags?: string;
	maxTime?: number;
	difficulty?: Difficulty;
	q?: string;
	visibility?: "public" | "private";
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
	const difficulty = DIFFICULTIES.includes(search.difficulty as Difficulty)
		? (search.difficulty as Difficulty)
		: undefined;
	const q = typeof search.q === "string" && search.q ? search.q : undefined;
	const visibility =
		search.visibility === "public" || search.visibility === "private"
			? search.visibility
			: undefined;
	return { tags, maxTime, difficulty, q, visibility };
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
	const activeDifficulty = search.difficulty;
	const activeQ = search.q;
	const activeVisibility = search.visibility;
	const hasConstraints =
		activeTags.length > 0 ||
		activeMaxTime != null ||
		activeDifficulty != null ||
		activeQ != null ||
		activeVisibility != null;

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

	function toggleDifficulty(value: Difficulty) {
		navigate({
			search: (prev) => ({
				...prev,
				difficulty: prev.difficulty === value ? undefined : value,
			}),
		});
	}

	function toggleVisibility(value: "public" | "private") {
		navigate({
			search: (prev) => ({
				...prev,
				visibility: prev.visibility === value ? undefined : value,
			}),
		});
	}

	function reset() {
		setSearchInput("");
		navigate({
			search: {
				tags: undefined,
				maxTime: undefined,
				difficulty: undefined,
				q: undefined,
				visibility: undefined,
			},
		});
	}

	return {
		activeTags,
		activeMaxTime,
		activeDifficulty,
		activeQ,
		activeVisibility,
		hasConstraints,
		searchInput,
		setSearchInput,
		toggleTag,
		toggleMaxTime,
		toggleDifficulty,
		toggleVisibility,
		reset,
	};
}
