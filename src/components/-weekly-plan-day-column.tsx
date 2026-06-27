import { EntryCard } from "#/components/-weekly-plan-entry-card";
import type { Entry } from "#/components/-weekly-plan-types";
import { formatDay } from "#/components/-weekly-plan-types";
import type { Day } from "#/generated/prisma/enums";

export function DayColumn({
	day,
	entries,
	onAdd,
	onRemove,
	onMove,
}: {
	day: Day;
	entries: Entry[];
	onAdd: () => void;
	onRemove: (id: string) => void;
	onMove: (id: string) => void;
}) {
	return (
		<div>
			<div className="flex items-center justify-between mb-2 pb-2 border-b border-stone-200">
				<span className="text-sm font-semibold text-stone-700">
					{formatDay(day)}
				</span>
				<button
					type="button"
					onClick={onAdd}
					className="text-xs text-stone-500 hover:text-stone-800 border border-stone-300 hover:border-stone-500 px-2 py-0.5 rounded-sm transition-colors"
				>
					+ Add
				</button>
			</div>
			<div
				className={`min-h-20 rounded-sm ${
					entries.length === 0
						? "flex items-center justify-center border-2 border-dashed border-stone-300 bg-stone-50"
						: "flex flex-row flex-wrap gap-2"
				}`}
			>
				{entries.length === 0 ? (
					<button
						type="button"
						onClick={onAdd}
						className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
					>
						+ Add a recipe
					</button>
				) : (
					entries.map((entry) => (
						<EntryCard
							key={entry.id}
							entry={entry}
							onRemove={onRemove}
							onMove={() => onMove(entry.id)}
						/>
					))
				)}
			</div>
		</div>
	);
}
