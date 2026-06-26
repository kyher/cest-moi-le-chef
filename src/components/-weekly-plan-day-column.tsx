import { useDroppable } from "@dnd-kit/core";
import {
	horizontalListSortingStrategy,
	SortableContext,
} from "@dnd-kit/sortable";
import { SortableEntryCard } from "#/components/-weekly-plan-entry-card";
import type { Entry } from "#/components/-weekly-plan-types";
import { DAY_LABELS } from "#/components/-weekly-plan-types";
import type { Day } from "#/generated/prisma/enums";

function DroppableColumn({
	day,
	isEmpty,
	isOver,
	onAdd,
	children,
}: {
	day: Day;
	isEmpty: boolean;
	isOver: boolean;
	onAdd: () => void;
	children: React.ReactNode;
}) {
	const { setNodeRef } = useDroppable({ id: day });
	return (
		<div
			ref={setNodeRef}
			className={`min-h-20 min-w-52 rounded-sm ${
				isEmpty
					? `flex items-center justify-center border-2 border-dashed ${isOver ? "border-amber-400 bg-amber-100" : "border-stone-300 bg-stone-50"}`
					: `flex flex-row flex-wrap gap-2${isOver ? " bg-stone-100" : ""}`
			}`}
		>
			{isEmpty && !isOver ? (
				<button
					type="button"
					onClick={onAdd}
					className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
				>
					+ Add a recipe
				</button>
			) : (
				children
			)}
		</div>
	);
}

export function DayColumn({
	day,
	entries,
	isOver,
	onAdd,
	onRemove,
}: {
	day: Day;
	entries: Entry[];
	isOver: boolean;
	onAdd: () => void;
	onRemove: (id: string) => void;
}) {
	const ids = entries.map((e) => e.id);

	return (
		<div>
			<div className="flex items-center justify-between mb-2 pb-2 border-b border-stone-200">
				<span className="text-sm font-semibold text-stone-700">
					{DAY_LABELS[day]}
				</span>
				<button
					type="button"
					onClick={onAdd}
					className="text-xs text-stone-500 hover:text-stone-800 border border-stone-300 hover:border-stone-500 px-2 py-0.5 rounded-sm transition-colors"
				>
					+ Add
				</button>
			</div>
			<SortableContext items={ids} strategy={horizontalListSortingStrategy}>
				<DroppableColumn
					day={day}
					isEmpty={entries.length === 0}
					isOver={isOver}
					onAdd={onAdd}
				>
					{entries.map((entry) => (
						<SortableEntryCard
							key={entry.id}
							entry={entry}
							onRemove={onRemove}
						/>
					))}
				</DroppableColumn>
			</SortableContext>
		</div>
	);
}
