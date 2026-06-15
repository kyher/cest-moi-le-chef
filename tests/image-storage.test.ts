import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
	deleteImageFile,
	validateImageFile,
	writeImageFile,
} from "#/lib/image-storage";

const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("@aws-sdk/client-s3", () => {
	class MockS3Client {
		send = mockSend;
	}
	return {
		S3Client: MockS3Client,
		PutObjectCommand: function (input: unknown) {
			return input;
		},
		DeleteObjectCommand: function (input: unknown) {
			return input;
		},
	};
});

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
		vi.stubEnv("R2_ACCESS_KEY_ID", "test-key-id");
		vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
		vi.stubEnv("R2_BUCKET_NAME", "test-bucket");
		vi.stubEnv("R2_PUBLIC_URL", "https://pub-test.r2.dev");
	});

	afterAll(() => {
		vi.unstubAllEnvs();
	});

	afterEach(() => {
		mockSend.mockClear();
	});

	it("uploads to R2 and returns a public URL", async () => {
		const url = await writeImageFile(makeFile(PNG, 100));

		expect(url).toMatch(/^https:\/\/pub-test\.r2\.dev\/[a-f0-9-]+\.png$/);
		expect(mockSend).toHaveBeenCalledOnce();
		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({
				Bucket: "test-bucket",
				ContentType: "image/png",
			}),
		);
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

	it("deleteImageFile sends DeleteObjectCommand with the filename as key", async () => {
		await deleteImageFile("https://pub-test.r2.dev/some-uuid.png");

		expect(mockSend).toHaveBeenCalledOnce();
		expect(mockSend).toHaveBeenCalledWith({
			Bucket: "test-bucket",
			Key: "some-uuid.png",
		});
	});

	it("deleteImageFile does not throw when R2 returns an error", async () => {
		mockSend.mockRejectedValueOnce(new Error("R2 error"));
		await expect(
			deleteImageFile("https://pub-test.r2.dev/nonexistent-uuid.png"),
		).resolves.not.toThrow();
	});
});
