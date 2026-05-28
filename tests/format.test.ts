import { describe, expect, it } from "vitest";
import { formatTotalTime } from "#/lib/format";

describe("formatTotalTime", () => {
	it("formats minutes only", () => {
		expect(formatTotalTime(45)).toBe("45m");
	});

	it("formats a single minute", () => {
		expect(formatTotalTime(1)).toBe("1m");
	});

	it("formats exact hours", () => {
		expect(formatTotalTime(60)).toBe("1h");
		expect(formatTotalTime(120)).toBe("2h");
	});

	it("formats hours and minutes", () => {
		expect(formatTotalTime(90)).toBe("1h 30m");
		expect(formatTotalTime(61)).toBe("1h 1m");
	});
});
