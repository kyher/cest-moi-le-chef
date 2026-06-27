import { Link } from "@tanstack/react-router";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import type { Entry } from "#/components/-weekly-plan-types";
import { formatTotalTime } from "#/lib/format";

export function EntryCard({
	entry,
	onRemove,
	onMove,
}: {
	entry: Entry;
	onRemove: (id: string) => void;
	onMove?: () => void;
}) {
	return (
		<div className="w-72 bg-stone-50 border border-stone-200 border-l-2 border-l-amber-300 group">
			{entry.recipe.imageUrl && (
				<img
					src={entry.recipe.imageUrl}
					alt=""
					className="w-full h-32 object-cover border-b border-stone-200"
				/>
			)}
			<div className="flex items-start gap-2 p-3">
				{onMove && (
					<button
						type="button"
						onClick={onMove}
						className="shrink-0 self-stretch flex items-center px-1 text-stone-300 hover:text-stone-500 active:text-stone-600"
						aria-label="Move to another day"
					>
						<ArrowRightLeft size={15} />
					</button>
				)}
				<div className="flex-1 min-w-0">
					<Link
						to="/recipes/$recipeId"
						params={{ recipeId: entry.recipe.id }}
						className="block text-sm font-medium text-stone-900 leading-tight hover:underline underline-offset-2"
					>
						{entry.recipe.title}
					</Link>
					{entry.recipe.totalTime != null && (
						<span className="text-xs text-stone-400 mt-1 block">
							{formatTotalTime(entry.recipe.totalTime)}
						</span>
					)}
				</div>
				<button
					type="button"
					onClick={() => onRemove(entry.id)}
					className="shrink-0 -mr-1 flex items-center justify-center w-8 h-8 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
					aria-label="Remove"
				>
					<Trash2 size={14} />
				</button>
			</div>
		</div>
	);
}
