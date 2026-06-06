import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
	deleteImageFile,
	validateImageFile,
	writeImageFile,
} from "#/lib/image-storage";

function makeFile(type: string, sizeBytes: number): File {
	const blob = new Blob([new Uint8Array(sizeBytes)], { type });
	return new File([blob], "test", { type });
}

const PNG = "image/png";
const JPEG = "image/jpeg";
const WEBP = "image/webp";
const MB = 1024 * 1024;

describe("validateImageFile", () => {
	it("accepts JPEG", () => {
		expect(() => validateImageFile(makeFile(JPEG, 100))).not.toThrow();
	});

	it("accepts PNG", () => {
		expect(() => validateImageFile(makeFile(PNG, 100))).not.toThrow();
	});

	it("accepts WebP", () => {
		expect(() => validateImageFile(makeFile(WEBP, 100))).not.toThrow();
	});

	it("rejects GIF", () => {
		expect(() => validateImageFile(makeFile("image/gif", 100))).toThrow(
			"Invalid file type",
		);
	});

	it("rejects PDF", () => {
		expect(() => validateImageFile(makeFile("application/pdf", 100))).toThrow(
			"Invalid file type",
		);
	});

	it("rejects a file over 5 MB", () => {
		expect(() => validateImageFile(makeFile(PNG, 5 * MB + 1))).toThrow(
			"File too large",
		);
	});

	it("accepts a file exactly at 5 MB", () => {
		expect(() => validateImageFile(makeFile(PNG, 5 * MB))).not.toThrow();
	});
});

describe("writeImageFile and deleteImageFile", () => {
	let tmpDir: string;

	beforeAll(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), "uploads-test-"));
		vi.stubEnv("UPLOADS_DIR", tmpDir);
	});

	afterAll(async () => {
		vi.unstubAllEnvs();
		await rm(tmpDir, { recursive: true, force: true });
	});

	it("writes the file to disk and returns an /uploads/ URL", async () => {
		const file = makeFile(PNG, 100);
		const url = await writeImageFile(file);

		expect(url).toMatch(/^\/uploads\/[a-f0-9-]+\.png$/);

		const filename = url.replace("/uploads/", "");
		const fileStat = await stat(join(tmpDir, filename));
		expect(fileStat.isFile()).toBe(true);
	});

	it("uses .jpg extension for JPEG", async () => {
		const url = await writeImageFile(makeFile(JPEG, 100));
		expect(url).toMatch(/\.jpg$/);
	});

	it("uses .webp extension for WebP", async () => {
		const url = await writeImageFile(makeFile(WEBP, 100));
		expect(url).toMatch(/\.webp$/);
	});

	it("generates a unique filename for each upload", async () => {
		const url1 = await writeImageFile(makeFile(PNG, 100));
		const url2 = await writeImageFile(makeFile(PNG, 100));
		expect(url1).not.toBe(url2);
	});

	it("deleteImageFile removes the file from disk", async () => {
		const url = await writeImageFile(makeFile(PNG, 100));
		await deleteImageFile(url);

		const filename = url.replace("/uploads/", "");
		const files = await readdir(tmpDir);
		expect(files).not.toContain(filename);
	});

	it("deleteImageFile does not throw when the file does not exist", async () => {
		await expect(
			deleteImageFile("/uploads/nonexistent-uuid.png"),
		).resolves.not.toThrow();
	});
});
