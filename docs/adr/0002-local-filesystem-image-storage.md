# Local filesystem storage for recipe images

Recipe cover images are written to a directory on the server filesystem and served as static files by nginx in production. The Recipe model holds the URL path to the image file. Filenames are random UUIDs — not derived from recipe IDs or user IDs — so they are not guessable or enumerable.

## Considered options

**Local filesystem vs object storage (Vercel Blob, S3, Cloudinary).** We chose local filesystem. The app deploys to a VPS, not a serverless platform, so persistent disk is available. The learning value of owning the full stack — file I/O, nginx static serving, disk cleanup — outweighs the operational simplicity of a managed storage service. Switching to object storage later is possible but requires migrating existing files and updating all stored `imageUrl` paths.

**UUID filenames vs auth-gated image access.** Images are served by nginx as plain static assets with no authentication check. Restricting image access to match recipe Visibility would require routing all image requests through the app server — adding latency and complexity. Recipe images are low-sensitivity content. Using UUID filenames makes image URLs effectively unguessable, which is sufficient protection for a personal recipe app.

**Immediate upload vs atomic upload on form save.** Images are uploaded as part of the form submission, not as a separate request when the file is selected. This eliminates orphaned files from abandoned create forms. A client-side preview is shown immediately via `URL.createObjectURL` — no server round-trip needed for the preview.
