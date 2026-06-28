import { X } from "lucide-react";
import { useEffect } from "react";
import type { DayMap } from "#/components/-weekly-plan-types";
import { DAYS, formatDay } from "#/components/-weekly-plan-types";

interface Props {
	dayMap: DayMap;
	onClose: () => void;
}

export function ShoppingList({ dayMap, onClose }: Props) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const entries = DAYS.flatMap((day) => dayMap[day]);

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
				<div className="px-4 pt-4 pb-3 border-b border-stone-200 shrink-0 flex items-center justify-between">
					<h2 className="font-semibold font-serif text-stone-900">
						Shopping List
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-stone-400 hover:text-stone-600 transition-colors"
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</div>

				<div className="overflow-y-auto flex-1">
					{entries.map((entry) => (
						<div
							key={entry.id}
							className="px-4 py-4 border-b border-stone-100 last:border-0"
						>
							<p className="text-sm font-semibold text-stone-800 mb-2">
								{entry.recipe.title}
								<span className="font-normal text-stone-400">
									{" "}
									· {formatDay(entry.day)}
								</span>
							</p>
							{entry.recipe.ingredients ? (
								<p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">
									{entry.recipe.ingredients}
								</p>
							) : (
								<p className="text-sm text-stone-400 italic">
									No ingredients listed
								</p>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
