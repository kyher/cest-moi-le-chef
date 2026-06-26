import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "@tanstack/react-router";
import { GripVertical } from "lucide-react";
import type { Entry } from "#/components/-weekly-plan-types";
import { formatTotalTime } from "#/lib/format";

export function SortableEntryCard({
	entry,
	onRemove,
}: {
	entry: Entry;
	onRemove: (id: string) => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: entry.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	return (
		<div ref={setNodeRef} style={style}>
			<EntryCard
				entry={entry}
				onRemove={onRemove}
				dragHandleProps={{ ...attributes, ...listeners }}
			/>
		</div>
	);
}

export function EntryCard({
	entry,
	onRemove,
	dragHandleProps,
	isDragging,
}: {
	entry: Entry;
	onRemove: (id: string) => void;
	dragHandleProps?: Record<string, unknown>;
	isDragging?: boolean;
}) {
	return (
		<div
			className={`w-52 bg-stone-50 border border-stone-200 border-l-2 border-l-amber-300 group ${isDragging ? "shadow-lg" : ""}`}
		>
			{entry.recipe.imageUrl && (
				<img
					src={entry.recipe.imageUrl}
					alt=""
					className="w-full h-20 object-cover border-b border-stone-200"
				/>
			)}
			<div className="flex items-start gap-1 p-2">
				<div
					{...dragHandleProps}
					className="shrink-0 mt-0.5 text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing"
				>
					<GripVertical size={14} />
				</div>
				<div className="flex-1 min-w-0">
					<Link
						to="/recipes/$recipeId"
						params={{ recipeId: entry.recipe.id }}
						className="block text-sm font-medium text-stone-900 leading-tight hover:underline underline-offset-2"
					>
						{entry.recipe.title}
					</Link>
					{entry.recipe.totalTime != null && (
						<span className="text-xs text-stone-400 mt-0.5 block">
							{formatTotalTime(entry.recipe.totalTime)}
						</span>
					)}
				</div>
				<button
					type="button"
					onClick={() => onRemove(entry.id)}
					className="shrink-0 mt-0.5 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
					aria-label="Remove"
				>
					<span className="text-sm leading-none">×</span>
				</button>
			</div>
		</div>
	);
}
