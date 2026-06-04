import { describe, expect, it } from "vitest";
import { validateRecipeSearch } from "#/lib/recipe-filters";

describe("validateRecipeSearch", () => {
	it("returns all fields when valid values are provided", () => {
		const result = validateRecipeSearch({
			tags: "italian,quick",
			maxTime: 30,
			q: "pasta",
		});
		expect(result).toEqual({ tags: "italian,quick", maxTime: 30, q: "pasta" });
	});

	it("returns undefined for missing fields", () => {
		const result = validateRecipeSearch({});
		expect(result.tags).toBeUndefined();
		expect(result.maxTime).toBeUndefined();
		expect(result.q).toBeUndefined();
	});

	it("returns undefined for an empty tags string", () => {
		const result = validateRecipeSearch({ tags: "" });
		expect(result.tags).toBeUndefined();
	});

	it("returns undefined for an empty q string", () => {
		const result = validateRecipeSearch({ q: "" });
		expect(result.q).toBeUndefined();
	});

	it("returns undefined for NaN maxTime", () => {
		const result = validateRecipeSearch({ maxTime: "not-a-number" });
		expect(result.maxTime).toBeUndefined();
	});

	it("returns undefined for empty string maxTime", () => {
		const result = validateRecipeSearch({ maxTime: "" });
		expect(result.maxTime).toBeUndefined();
	});

	it("returns undefined for null maxTime", () => {
		const result = validateRecipeSearch({ maxTime: null });
		expect(result.maxTime).toBeUndefined();
	});

	it("coerces a numeric string maxTime to a number", () => {
		const result = validateRecipeSearch({ maxTime: "60" });
		expect(result.maxTime).toBe(60);
	});

	it("ignores non-string tags values", () => {
		const result = validateRecipeSearch({ tags: 123 });
		expect(result.tags).toBeUndefined();
	});
});
