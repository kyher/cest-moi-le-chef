interface Props {
	value: string;
	onChange: (value: string) => void;
}

export function RecipeSearch({ value, onChange }: Props) {
	return (
		<div className="relative mb-4">
			<input
				type="text"
				placeholder="Search recipes…"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full px-3 py-2 text-sm border border-stone-200 bg-white placeholder-stone-400 focus:outline-none focus:border-stone-400"
			/>
			{value && (
				<button
					type="button"
					onClick={() => onChange("")}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
					aria-label="Clear search"
				>
					✕
				</button>
			)}
		</div>
	);
}
