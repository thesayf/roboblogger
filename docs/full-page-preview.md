# Full-page documents and private previews

Published single-post responses include `renderMode: "components" | "full_page"`. In full-page mode, `fullPageDocument` contains `{schemaVersion:1, html, css, assets}`. Each asset has `assetId`, `url`, `width`, `height`, and `alt`. The document owns the hero and exactly one H1. The destination owns navigation, footer, metadata and routing. Full-page bodies are server-rendered without an iframe; the editor alone uses a sandboxed iframe.

HTML is sanitised; CSS has a restricted grammar and is scoped below `.vb-full-page`. JavaScript, arbitrary embeds, CSS imports, external stylesheet resources, positioning, custom properties and animations are unsupported. Managed image URLs must match the destination-configured ImageKit account path. Desktop/mobile preview and the destination use the same validator.

## Private draft workflow

The owner-authenticated editor uses `GET /api/blog/posts/{id}/full-page` and `POST` with `{action:"save"|"preview",document}`. These do not alter the published snapshot. Activation is a separate explicit action. Existing component posts remain unchanged.

`GET /api/v1/posts/{slug}/preview` requires `posts:read` plus an explicit per-key `previewPostIds` allowlist containing the requested owner-matching post ID. Published-read permission alone does not permit preview. Responses are private/no-store and noindex. This endpoint returns the saved private draft as `renderMode:"full_page"`, even when the public post remains in component mode or unpublished. The normal published endpoint still excludes drafts.

Practice's `/blog/preview/{slug}` additionally requires a signed-in Clerk user with a verified email in `BLOG_PREVIEW_ALLOWED_EMAILS`. It fetches the preview API server-side using its existing server key and renders the document through the same FullPage component as public articles. The preview is dynamic, non-indexable, and excluded from listings/sitemaps. The API key never reaches the browser. The benchmark authorisation is scoped to one post.

## Benchmark

`fixtures/full-page-benchmark.json` contains a full-page document with two real VibeBlogger-managed ImageKit images. The stored QA post remains draft, and no full-page published snapshot is enabled. The hosted preview is https://practice.cx/blog/preview/private-full-page-workflow-test-do-not-publish . Sign in to Practice with the approved account before opening it.

Use desktop and mobile browser widths to verify the hero/H1, responsive grid, both image loads, absence of overflow, and unchanged site navigation/footer. Inspect the initial HTML response to confirm article copy and images are server-rendered. Unauthenticated requests must fail closed. The public draft URL must remain 404. Invalid full-page payloads use the controlled renderer fallback; sanitizer regression tests cover scripts, links and CSS containment.
