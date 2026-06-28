import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MoveDayPicker } from "#/components/-move-day-picker";
import { RecipePicker } from "#/components/-recipe-picker";
import { DayColumn } from "#/components/-weekly-plan-day-column";
import { ShoppingList } from "#/components/-weekly-plan-shopping-list";
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
	const { t } = useTranslation();
	const [dayMap, setDayMap] = useState<DayMap>(() => toDayMap(loaderEntries));
	const [pickerDay, setPickerDay] = useState<Day | null>(null);
	const [movingEntryId, setMovingEntryId] = useState<string | null>(null);
	const [confirming, setConfirming] = useState(false);
	const [showShoppingList, setShowShoppingList] = useState(false);

	const totalEntries = DAYS.reduce((n, d) => n + dayMap[d].length, 0);

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

	function handleMove(targetDay: Day) {
		if (!movingEntryId) return;
		const entryId = movingEntryId;
		setMovingEntryId(null);
		setDayMap((prev) => {
			const sourceDay = findContainer(entryId, prev);
			if (!sourceDay || sourceDay === targetDay) return prev;
			const entry = prev[sourceDay].find((e) => e.id === entryId);
			if (!entry) return prev;
			const next = {
				...prev,
				[sourceDay]: prev[sourceDay].filter((e) => e.id !== entryId),
				[targetDay]: [...prev[targetDay], { ...entry, day: targetDay }],
			};
			void updatePlanEntries({ data: { updates: toFlat(next) } });
			return next;
		});
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
			<div className="flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-3xl font-bold font-serif text-stone-900">
					{t("weeklyPlan.title")}
				</h1>
				{totalEntries > 0 && (
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setShowShoppingList(true)}
							className="h-8 px-3 text-sm text-stone-500 hover:text-stone-800 border border-stone-300 hover:border-stone-400 transition-colors rounded-sm"
						>
							{t("weeklyPlan.shoppingList")}
						</button>
						<button
							type="button"
							onClick={() => setConfirming(true)}
							className="h-8 px-3 text-sm text-stone-500 hover:text-stone-800 border border-stone-300 hover:border-stone-400 transition-colors rounded-sm"
						>
							{t("weeklyPlan.clearPlan")}
						</button>
					</div>
				)}
			</div>

			<div className="flex flex-col gap-6">
				{DAYS.map((day) => (
					<DayColumn
						key={day}
						day={day}
						entries={dayMap[day]}
						onAdd={() => setPickerDay(day)}
						onRemove={handleRemove}
						onMove={setMovingEntryId}
					/>
				))}
			</div>

			{pickerDay && (
				<RecipePicker
					day={pickerDay}
					ownRecipes={options.ownRecipes}
					likedRecipes={options.likedRecipes}
					onAdd={handleAdd}
					onClose={() => setPickerDay(null)}
				/>
			)}
			{movingEntryId && (
				<MoveDayPicker
					currentDay={findContainer(movingEntryId, dayMap) ?? "MONDAY"}
					onMove={handleMove}
					onClose={() => setMovingEntryId(null)}
				/>
			)}
			{showShoppingList && (
				<ShoppingList
					dayMap={dayMap}
					onClose={() => setShowShoppingList(false)}
				/>
			)}
			{confirming && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<button
						type="button"
						onClick={() => setConfirming(false)}
						className="absolute inset-0 bg-black/40"
						aria-label="Close"
						tabIndex={-1}
					/>
					<div
						role="dialog"
						aria-modal="true"
						className="relative z-10 bg-white w-full max-w-sm shadow-lg p-6"
					>
						<h2 className="font-semibold font-serif text-stone-900 mb-2">
							{t("weeklyPlan.clearTitle")}
						</h2>
						<p className="text-sm text-stone-600 mb-6">
							{t("weeklyPlan.clearBody")}
						</p>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setConfirming(false)}
								className="h-9 px-4 text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("common.cancel")}
							</button>
							<button
								type="button"
								onClick={handleClear}
								className="h-9 px-4 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors rounded-sm"
							>
								{t("weeklyPlan.clearPlan")}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
