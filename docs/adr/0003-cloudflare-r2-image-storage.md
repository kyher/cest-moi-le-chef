# Cloudflare R2 for Cover Image storage

Supersedes the image storage section of ADR-0002. The move to Netlify (a serverless platform) makes local filesystem storage impossible — the runtime filesystem is read-only and ephemeral. Cover Images are instead stored in a Cloudflare R2 bucket and served from R2's public URL. The Recipe model continues to hold the image URL; the value changes from `/uploads/<uuid>.<ext>` to the full R2 public URL.

## Considered options

**R2 vs Supabase Storage.** R2 was chosen over Supabase Storage because no other Supabase services are in use — adopting Supabase Storage would pull in a second managed platform for a single feature. R2 is standalone, has a generous free tier, and exposes an S3-compatible API with good SDK support.

**Public bucket vs signed URLs.** Images remain publicly accessible regardless of recipe Visibility (established in ADR-0002). R2's public bucket URL is sufficient; signed URLs would add complexity with no privacy benefit.

**Local dev.** R2 is used in all environments, including local development. `.env.local` must include the R2 credentials. A separate dev bucket is optional but not required for a single-developer project.
