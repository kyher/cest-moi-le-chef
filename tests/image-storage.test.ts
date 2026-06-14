import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
	deleteImageFile,
	validateImageFile,
	writeImageFile,
} from "#/lib/image-storage";

const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("@aws-sdk/client-s3", () => ({
	S3Client: class {
		send(...args: unknown[]) {
			return mockSend(...args);
		}
	},
	PutObjectCommand: class {
		constructor(public input: Record<string, unknown>) {}
	},
	DeleteObjectCommand: class {
		constructor(public input: Record<string, unknown>) {}
	},
}));

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
	beforeAll(() => {
		vi.stubEnv("R2_ACCOUNT_ID", "test-account");
		vi.stubEnv("R2_ACCESS_KEY_ID", "test-key");
		vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
		vi.stubEnv("R2_BUCKET_NAME", "test-bucket");
		vi.stubEnv("R2_PUBLIC_URL", "https://pub.test.r2.dev");
	});

	afterEach(() => {
		mockSend.mockClear();
	});

	it("uploads to R2 and returns a public URL", async () => {
		const url = await writeImageFile(makeFile(PNG, 100));

		expect(mockSend).toHaveBeenCalledOnce();
		const [cmd] = mockSend.mock.calls[0] as [
			{ input: Record<string, unknown> },
		];
		expect(cmd.input.Bucket).toBe("test-bucket");
		expect(url).toMatch(/^https:\/\/pub\.test\.r2\.dev\/[a-f0-9-]+\.png$/);
		expect(url).toBe(`https://pub.test.r2.dev/${cmd.input.Key}`);
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

	it("deleteImageFile sends a delete command with the correct key", async () => {
		const url = await writeImageFile(makeFile(PNG, 100));
		const [putCmd] = mockSend.mock.calls[0] as [
			{ input: Record<string, unknown> },
		];
		const uploadedKey = putCmd.input.Key;

		mockSend.mockClear();
		await deleteImageFile(url);

		expect(mockSend).toHaveBeenCalledOnce();
		const [delCmd] = mockSend.mock.calls[0] as [
			{ input: Record<string, unknown> },
		];
		expect(delCmd.input.Key).toBe(uploadedKey);
		expect(delCmd.input.Bucket).toBe("test-bucket");
	});

	it("deleteImageFile does not throw when the object does not exist", async () => {
		await expect(
			deleteImageFile("https://pub.test.r2.dev/nonexistent-uuid.png"),
		).resolves.not.toThrow();
	});
});
