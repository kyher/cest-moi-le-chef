import type { Day } from "#/generated/prisma/enums";
import type { getWeeklyPlan } from "#/lib/weekly-plan-fns";

export const DAYS: Day[] = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
];

export type Entry = Awaited<ReturnType<typeof getWeeklyPlan>>[number];
export type DayMap = Record<Day, Entry[]>;

export function toDayMap(entries: Entry[]): DayMap {
	const map = Object.fromEntries(DAYS.map((d) => [d, []])) as unknown as DayMap;
	for (const entry of entries) {
		map[entry.day as Day].push(entry);
	}
	for (const day of DAYS) {
		map[day].sort((a, b) => a.order - b.order);
	}
	return map;
}

export function toFlat(dayMap: DayMap) {
	return DAYS.flatMap((day) =>
		dayMap[day].map((e, i) => ({ id: e.id, day, order: i })),
	);
}

export function findContainer(id: string, dayMap: DayMap): Day | null {
	if (DAYS.includes(id as Day)) return id as Day;
	for (const day of DAYS) {
		if (dayMap[day].some((e) => e.id === id)) return day;
	}
	return null;
}
