# Cloudflare R2 for recipe image storage

Supersedes ADR 0002.

Recipe images are stored in a Cloudflare R2 bucket and served via Cloudflare's public CDN. The Recipe model holds the full public URL to the image file. Filenames are random UUIDs to prevent enumeration.

## Considered options

**Local filesystem vs R2.** ADR 0002 chose local filesystem, valuing the learning benefit of owning file I/O and nginx static serving. With the move to Coolify container deployments, a persistent Docker volume would be required to retain uploaded images across container restarts and redeployments. R2 eliminates that operational burden entirely — the container becomes fully stateless — and serves images from Cloudflare's edge rather than the VPS.

**Public vs private bucket.** Images are stored in a public R2 bucket. The existing access model does not restrict image access by recipe Visibility — anyone who knows the URL can fetch the image. UUID filenames make URLs effectively unguessable. Presigned URLs would add per-request complexity and expiry management for no meaningful security gain in a personal recipe app.
