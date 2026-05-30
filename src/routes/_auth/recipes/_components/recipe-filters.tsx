import type { getTagsInUse } from "#/lib/recipes";

type TagInUse = Awaited<ReturnType<typeof getTagsInUse>>[number];

const TIME_BUCKETS = [
	{ label: "≤15m", value: 15 },
	{ label: "≤30m", value: 30 },
	{ label: "≤1h", value: 60 },
	{ label: "≤2h", value: 120 },
] as const;

interface Props {
	tagsInUse: TagInUse[];
	activeTags: string[];
	activeMaxTime: number | undefined;
	onToggleTag: (name: string) => void;
	onToggleMaxTime: (minutes: number) => void;
}

export function RecipeFilters({
	tagsInUse,
	activeTags,
	activeMaxTime,
	onToggleTag,
	onToggleMaxTime,
}: Props) {
	return (
		<div className="mb-6 border border-stone-200 p-4">
			<p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">
				Filters
			</p>
			<div className="space-y-2">
				{tagsInUse.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{tagsInUse.map((tag) => {
							const active = activeTags.includes(tag.name);
							return (
								<button
									type="button"
									key={tag.id}
									onClick={() => onToggleTag(tag.name)}
									className={
										active
											? "px-2.5 py-1 text-xs font-medium bg-amber-100 text-stone-800 border border-amber-400 cursor-pointer"
											: "px-2.5 py-1 text-xs text-stone-600 bg-white border border-stone-300 hover:border-stone-400 transition-colors cursor-pointer"
									}
								>
									{tag.name}
								</button>
							);
						})}
					</div>
				)}
				<div className="flex flex-wrap gap-2 items-center">
					{TIME_BUCKETS.map(({ label, value }) => {
						const active = activeMaxTime === value;
						return (
							<button
								type="button"
								key={value}
								onClick={() => onToggleMaxTime(value)}
								className={
									active
										? "px-2.5 py-1 text-xs font-medium bg-stone-800 text-white cursor-pointer"
										: "px-2.5 py-1 text-xs text-stone-600 bg-white border border-stone-300 hover:border-stone-400 transition-colors cursor-pointer"
								}
							>
								{label}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
