const TIME_BUCKETS = [
	{ label: "≤15m", value: 15 },
	{ label: "≤30m", value: 30 },
	{ label: "≤1h", value: 60 },
	{ label: "≤2h", value: 120 },
] as const;

interface Props {
	show: boolean;
	tagsInUse: { name: string }[];
	activeTags: string[];
	activeMaxTime: number | undefined;
	activeVisibility?: "public" | "private" | undefined;
	hasConstraints: boolean;
	searchInput: string;
	onSearchChange: (value: string) => void;
	onToggleTag: (name: string) => void;
	onToggleMaxTime: (minutes: number) => void;
	onToggleVisibility?: (value: "public" | "private") => void;
	onReset: () => void;
}

export function RecipeFilterPanel({
	show,
	tagsInUse,
	activeTags,
	activeMaxTime,
	activeVisibility,
	hasConstraints,
	searchInput,
	onSearchChange,
	onToggleTag,
	onToggleMaxTime,
	onToggleVisibility,
	onReset,
}: Props) {
	if (!show) return null;

	return (
		<>
			<div className="relative mb-4">
				<input
					type="text"
					placeholder="Search recipes…"
					value={searchInput}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full px-3 py-2 text-sm rounded-sm border border-stone-200 bg-white placeholder-stone-400 focus:outline-none focus:border-stone-400"
				/>
				{searchInput && (
					<button
						type="button"
						onClick={() => onSearchChange("")}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
						aria-label="Clear search"
					>
						✕
					</button>
				)}
			</div>

			<div className="mb-6 border border-stone-200 p-4">
				<div className="space-y-4">
					{tagsInUse.length > 0 && (
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
								Tags
							</p>
							<div className="flex flex-wrap gap-2">
								{tagsInUse.map((tag) => {
									const active = activeTags.includes(tag.name);
									return (
										<button
											type="button"
											key={tag.name}
											onClick={() => onToggleTag(tag.name)}
											className={
												active
													? "px-2.5 py-1 text-xs font-medium rounded-sm bg-amber-100 text-stone-800 border border-amber-400 cursor-pointer"
													: "px-2.5 py-1 text-xs rounded-sm text-stone-600 bg-white border border-stone-300 hover:border-stone-400 transition-colors cursor-pointer"
											}
										>
											{tag.name}
										</button>
									);
								})}
							</div>
						</div>
					)}
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
							Cooking Time
						</p>
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
												? "px-2.5 py-1 text-xs font-medium rounded-sm bg-amber-100 text-stone-800 border border-amber-400 cursor-pointer"
												: "px-2.5 py-1 text-xs rounded-sm text-stone-600 bg-white border border-stone-300 hover:border-stone-400 transition-colors cursor-pointer"
										}
									>
										{label}
									</button>
								);
							})}
						</div>
					</div>
					{onToggleVisibility && (
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
								Visibility
							</p>
							<div className="flex flex-wrap gap-2 items-center">
								{(["public", "private"] as const).map((v) => (
									<button
										type="button"
										key={v}
										onClick={() => onToggleVisibility(v)}
										className={
											activeVisibility === v
												? "px-2.5 py-1 text-xs font-medium rounded-sm bg-amber-100 text-stone-800 border border-amber-400 cursor-pointer capitalize"
												: "px-2.5 py-1 text-xs rounded-sm text-stone-600 bg-white border border-stone-300 hover:border-stone-400 transition-colors cursor-pointer capitalize"
										}
									>
										{v}
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{hasConstraints && (
				<button
					type="button"
					onClick={onReset}
					className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700 transition-colors cursor-pointer mb-6"
				>
					Reset
				</button>
			)}
		</>
	);
}
