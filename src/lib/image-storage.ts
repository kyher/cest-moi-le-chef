import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

function uploadsDir() {
	return process.env.UPLOADS_DIR ?? "./public/uploads";
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

const EXT_MAP: Record<string, string> = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
};

export function validateImageFile(file: File) {
	if (!ALLOWED_TYPES.has(file.type)) {
		throw new Error("Invalid file type. Accepted: JPEG, PNG, WebP.");
	}
	if (file.size > MAX_BYTES) {
		throw new Error("File too large. Maximum size is 5 MB.");
	}
}

export async function writeImageFile(file: File): Promise<string> {
	validateImageFile(file);
	const dir = uploadsDir();
	await mkdir(dir, { recursive: true });
	const ext = EXT_MAP[file.type];
	const filename = `${randomUUID()}${ext}`;
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(join(dir, filename), buffer);
	return `/uploads/${filename}`;
}

export async function deleteImageFile(imageUrl: string): Promise<void> {
	const filename = imageUrl.replace(/^\/uploads\//, "");
	await unlink(join(uploadsDir(), filename)).catch(() => {});
}
