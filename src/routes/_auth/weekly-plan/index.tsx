import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	pointerWithin,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RecipePicker } from "#/components/-recipe-picker";
import { DayColumn } from "#/components/-weekly-plan-day-column";
import { EntryCard } from "#/components/-weekly-plan-entry-card";
import {
	DAYS,
	type DayMap,
	findContainer,
	toDayMap,
	toFlat,
} from "#/components/-weekly-plan-types";
import type { Day } from "#/generated/prisma/enums";
import {
	addPlanEntry,
	clearWeeklyPlan,
	getWeeklyPlan,
	getWeeklyPlanRecipeOptions,
	removePlanEntry,
	updatePlanEntries,
} from "#/lib/weekly-plan-fns";

export const Route = createFileRoute("/_auth/weekly-plan/")({
	loader: () =>
		Promise.all([getWeeklyPlan(), getWeeklyPlanRecipeOptions()]).then(
			([entries, options]) => ({ entries, options }),
		),
	component: WeeklyPlanPage,
});

function WeeklyPlanPage() {
	const { entries: loaderEntries, options } = Route.useLoaderData();
	const [dayMap, setDayMap] = useState<DayMap>(() => toDayMap(loaderEntries));
	const [pickerDay, setPickerDay] = useState<Day | null>(null);
	const [confirming, setConfirming] = useState(false);
	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);

	const totalEntries = DAYS.reduce((n, d) => n + dayMap[d].length, 0);
	const activeEntry = activeId
		? DAYS.flatMap((d) => dayMap[d]).find((e) => e.id === activeId)
		: null;
	const dragOverDay = activeId
		? (DAYS.find((d) => dayMap[d].some((e) => e.id === activeId)) ?? null)
		: null;

	function handleDragStart({ active }: DragStartEvent) {
		setActiveId(String(active.id));
	}

	function handleDragOver({ active, over }: DragOverEvent) {
		if (!over) return;
		const activeId = String(active.id);
		const overId = String(over.id);

		setDayMap((prev) => {
			const activeContainer = findContainer(activeId, prev);
			const overContainer = findContainer(overId, prev);
			if (
				!activeContainer ||
				!overContainer ||
				activeContainer === overContainer
			)
				return prev;

			const activeItems = [...prev[activeContainer]];
			const overItems = [...prev[overContainer]];
			const activeIndex = activeItems.findIndex((e) => e.id === activeId);
			const overIndex = overItems.findIndex((e) => e.id === overId);

			const [item] = activeItems.splice(activeIndex, 1);
			const insertAt = overIndex >= 0 ? overIndex : overItems.length;
			overItems.splice(insertAt, 0, { ...item, day: overContainer });

			return {
				...prev,
				[activeContainer]: activeItems,
				[overContainer]: overItems,
			};
		});
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		setActiveId(null);
		if (!over) return;

		const activeId = String(active.id);
		const overId = String(over.id);

		setDayMap((prev) => {
			const activeContainer = findContainer(activeId, prev);
			const overContainer = findContainer(overId, prev);
			if (!activeContainer || !overContainer) return prev;

			let next = prev;

			if (activeContainer === overContainer) {
				const items = prev[activeContainer];
				const activeIndex = items.findIndex((e) => e.id === activeId);
				const overIndex = items.findIndex((e) => e.id === overId);
				if (activeIndex !== overIndex) {
					next = {
						...prev,
						[activeContainer]: arrayMove(items, activeIndex, overIndex),
					};
				}
			}

			void updatePlanEntries({ data: { updates: toFlat(next) } });
			return next;
		});
	}

	async function handleAdd(recipeId: string) {
		if (!pickerDay) return;
		const day = pickerDay;
		setPickerDay(null);
		const newEntry = await addPlanEntry({ data: { recipeId, day } });
		setDayMap((prev) => ({
			...prev,
			[day]: [...prev[day], newEntry],
		}));
	}

	async function handleRemove(entryId: string) {
		setDayMap((prev) => {
			const day = findContainer(entryId, prev);
			if (!day) return prev;
			return { ...prev, [day]: prev[day].filter((e) => e.id !== entryId) };
		});
		await removePlanEntry({ data: { entryId } });
	}

	async function handleClear() {
		setConfirming(false);
		setDayMap(
			Object.fromEntries(DAYS.map((d) => [d, []])) as unknown as DayMap,
		);
		await clearWeeklyPlan();
	}

	return (
		<div className="py-10">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold font-serif text-stone-900">
					Weekly Plan
				</h1>
				{totalEntries > 0 && (
					<div className="flex items-center gap-2">
						{confirming ? (
							<>
								<span className="text-sm text-stone-600">Clear all?</span>
								<button
									type="button"
									onClick={handleClear}
									className="h-8 px-3 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors rounded-sm"
								>
									Yes, clear
								</button>
								<button
									type="button"
									onClick={() => setConfirming(false)}
									className="h-8 px-3 text-sm text-stone-600 hover:text-stone-900 transition-colors"
								>
									Cancel
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={() => setConfirming(true)}
								className="h-8 px-3 text-sm text-stone-500 hover:text-stone-800 border border-stone-300 hover:border-stone-400 transition-colors rounded-sm"
							>
								Clear plan
							</button>
						)}
					</div>
				)}
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={(args) =>
					pointerWithin(args).length > 0
						? pointerWithin(args)
						: closestCenter(args)
				}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
			>
				<div className="flex flex-col gap-6">
					{DAYS.map((day) => (
						<DayColumn
							key={day}
							day={day}
							entries={dayMap[day]}
							isOver={dragOverDay === day}
							onAdd={() => setPickerDay(day)}
							onRemove={handleRemove}
						/>
					))}
				</div>

				<DragOverlay>
					{activeEntry ? (
						<EntryCard entry={activeEntry} onRemove={() => {}} isDragging />
					) : null}
				</DragOverlay>
			</DndContext>

			{pickerDay && (
				<RecipePicker
					day={pickerDay}
					ownRecipes={options.ownRecipes}
					likedRecipes={options.likedRecipes}
					onAdd={handleAdd}
					onClose={() => setPickerDay(null)}
				/>
			)}
		</div>
	);
}
