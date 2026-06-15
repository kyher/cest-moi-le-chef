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

function r2() {
	return {
		client: new S3Client({
			region: "auto",
			endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
				secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
			},
		}),
		bucket: process.env.R2_BUCKET_NAME ?? "",
		publicUrl: process.env.R2_PUBLIC_URL ?? "",
	};
}

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
	const { client, bucket, publicUrl } = r2();
	const ext = EXT_MAP[file.type];
	const filename = `${randomUUID()}${ext}`;
	const buffer = Buffer.from(await file.arrayBuffer());
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: filename,
			Body: buffer,
			ContentType: file.type,
		}),
	);
	return `${publicUrl}/${filename}`;
}

export async function deleteImageFile(imageUrl: string): Promise<void> {
	const { client, bucket } = r2();
	const filename = imageUrl.split("/").pop();
	if (!filename) return;
	await client
		.send(new DeleteObjectCommand({ Bucket: bucket, Key: filename }))
		.catch(() => {});
}
