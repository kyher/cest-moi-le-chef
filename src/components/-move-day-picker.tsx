import { DAYS, formatDay } from "#/components/-weekly-plan-types";
import type { Day } from "#/generated/prisma/enums";

interface Props {
	currentDay: Day;
	onMove: (day: Day) => void;
	onClose: () => void;
}

export function MoveDayPicker({ currentDay, onMove, onClose }: Props) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
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
				className="relative z-10 bg-white w-full max-w-xs shadow-lg"
			>
				<div className="px-4 pt-4 pb-3 border-b border-stone-200">
					<h2 className="font-semibold font-serif text-stone-900">Move to…</h2>
				</div>
				<div>
					{DAYS.map((day) => (
						<button
							key={day}
							type="button"
							disabled={day === currentDay}
							onClick={() => onMove(day)}
							className="w-full flex items-center px-4 py-3.5 text-sm text-left border-b border-stone-100 last:border-0 transition-colors disabled:text-stone-300 hover:bg-stone-50 active:bg-stone-100"
						>
							{formatDay(day)}
							{day === currentDay && (
								<span className="ml-auto text-xs text-stone-400">current</span>
							)}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
