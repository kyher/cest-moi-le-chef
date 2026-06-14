import { randomUUID } from "node:crypto";
import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

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

function r2Client() {
	return new S3Client({
		region: "auto",
		endpoint: `https://${process.env.R2_ACCOUNT_ID ?? ""}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
			secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
		},
	});
}

export async function writeImageFile(file: File): Promise<string> {
	validateImageFile(file);
	const ext = EXT_MAP[file.type];
	const key = `${randomUUID()}${ext}`;
	await r2Client().send(
		new PutObjectCommand({
			Bucket: process.env.R2_BUCKET_NAME ?? "",
			Key: key,
			Body: Buffer.from(await file.arrayBuffer()),
			ContentType: file.type,
		}),
	);
	return `${process.env.R2_PUBLIC_URL ?? ""}/${key}`;
}

export async function deleteImageFile(imageUrl: string): Promise<void> {
	const key = imageUrl.replace(`${process.env.R2_PUBLIC_URL ?? ""}/`, "");
	await r2Client().send(
		new DeleteObjectCommand({
			Bucket: process.env.R2_BUCKET_NAME ?? "",
			Key: key,
		}),
	);
}
