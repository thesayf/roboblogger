# Private full-page draft API

Base URL: `https://vibeblogger.io/api/v1`. Send `Authorization: Bearer $VIBEBLOGGER_API_KEY` (or `X-API-Key`). Keep keys server-side.

Every draft and asset endpoint below requires the **exact `full-page:write` permission**. Legacy `read`/`write`, `posts:read` and topic permissions do not imply it. The owner comes from the key, never from input. Publication requires the separate exact `full-page:publish` permission and an explicit request to the endpoint documented below. Draft writing never implies publication authority.

## Daily authoring workflow

1. `GET /assets?limit=20&skip=0` to browse the key owner's ImageKit folder. Returns `assets[{assetId,url,width,height,name,alt,size}]`, `limit`, `skip`, `hasMore`. Add meaningful `alt` text. Only the exact owner folder is exposed, not other accounts with similar names or emails.
2. Optionally `POST /assets` with `{fileName:"diagram.png",fileBase64:"<raw base64 bytes>",alt:"Description"}`. Supports PNG/JPEG/WebP, 8 MB maximum, unique filenames, owner folder only. No remote URLs, SVG, arbitrary paths, overwrite or delete operation. Returns `{asset:{assetId,url,width,height,alt,...}}`. Uploads use the existing ImageKit account and its ordinary CDN visibility: **draft privacy does not make media URLs private**. Do not upload confidential assets.
3. `POST /full-page/validate` with `{document: {...}}`. Returns `{valid:true,document,articleMode}` without writes. Main HTML and interaction markup are sanitised, CSS is validated/scoped when rendered, and assets are checked against ImageKit IDs, original URLs, dimensions and owner folder. The returned document is authored source suitable for saving, not twice-scoped render output.
4. `POST /full-page/drafts` with `{title,description,slug,document}`. Optional `authorName,category,tags,seoTitle,seoDescription`. Creates a draft and full-page document together transactionally. Returns HTTP 201 with `postId,slug,title,description,status,revision,document,articleMode,editorUrl,previewApiUrl`. Slugs are globally unique: on 409, look up the existing draft; do not blindly recreate.
5. `GET /full-page/drafts?limit=20&skip=0` lists private owner posts (including component drafts). `GET /full-page/drafts/{postId}` returns the current custom document and revision (0/null if no custom document yet).
6. `PATCH /full-page/drafts/{postId}` with `{expectedRevision:1,document:{...}}` saves another private revision. Only these two fields are accepted. Read first, reconcile edits, and supply the actual last-read revision. A stale revision returns 409 and writes nothing. Revision 0 initializes a component-only private draft. Metadata edits are not part of PATCH; create the metadata correctly or edit it in the authenticated editor.
7. Ask the owner to review `editorUrl`. Nothing here publishes or activates a public snapshot. Published/archived posts cannot be updated by the draft-writing routes. To experiment with an existing public article, create a separate private draft.

All responses use `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`. Never expose the writer key in browser code. Existing API rate limits apply (per running instance). JSON input is stream-limited to 1.6 MB (12 MB for base64 uploads); document-specific limits still apply, including 400,000 serialized characters and at most 100 assets.

## Minimal create example

```sh
curl https://vibeblogger.io/api/v1/full-page/drafts \
  -H "Authorization: Bearer $VIBEBLOGGER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @draft.json
```

`draft.json`:
```json
{
  "title": "Consulting profitability",
  "description": "A private guide to project economics.",
  "slug": "consulting-profitability-private-example",
  "document": {
    "schemaVersion": 1,
    "html": "<section class=\"guide\"><h1>Know your margin.</h1><p>A private example.</p></section>",
    "css": ".guide{max-width:1040px;margin:0 auto;padding:32px;color:#203a32}",
    "assets": []
  }
}
```

For schema version 2, use `fixtures/consulting-profitability.json` as the `document`. It includes authored HTML/CSS, sandboxed JavaScript and readable static fallback. Exactly one main H1 and one empty placement marker per interaction are required. See [interactive articles](interactive-articles.md) for the complete runtime contract and sandbox limits.

## Preview access is separate

The writer can read its owner's private drafts with `/full-page/drafts/{id}`. This does not add IDs to another key's `previewPostIds` grants. Practice's website key remains read-only; `/posts/{slug}/preview` still requires `posts:read` and an explicit post grant. Practice's browser preview also requires an approved signed-in account. Creating a draft does not automatically make a new hosted Practice preview link available. Use the editor URL for immediate private review; request a narrow website-preview grant if required.

## Errors

- 400: malformed JSON, unknown fields (including status/owner/publish/action), invalid metadata or pagination, missing expectedRevision.
- 401: missing, invalid or revoked key.
- 403: missing exact `full-page:write` permission.
- 404: missing, foreign-owner or non-draft post.
- 409: duplicate slug or stale revision; reread before retrying.
- 413: oversized request or image.
- 415: unsupported content type or image format.
- 422: document validation or owned-asset verification failed.
- 429: key rate limit exceeded.

There is intentionally no DELETE operation. No automatic image generation or external network execution is added by this feature.


## Explicit publication API

`POST /full-page/posts/{postId}/publish` requires **`full-page:publish`** (independent of `full-page:write`). Send exactly:

```json
{"action":"publish","expectedRevision":2}
```

The endpoint reads and revalidates that stored draft, verifies managed asset ownership, preserves the previous published layout in `previousPublished`, activates the validated snapshot, sets the post status to `published`, and increments the revision in one database transaction. It preserves an existing publication date on subsequent publication. It never accepts replacement HTML or a caller-supplied owner or URL. Missing/foreign/archived posts return 404; invalid documents or missing required metadata return 422; stale revisions return 409 with no changes. A retry after a successful publish returns 409: read the current state rather than blindly retrying.

The response includes `postId`, `slug`, `status`, `renderMode`, `articleMode`, `revision`, `publishedAt`, `publicApiUrl` and `liveUrl`. `liveUrl` is derived from the owner's **Brand → Blog URL** (for Practice, `https://practice.cx/blog`); it is null if that URL is absent or invalid. Publication does not verify or invalidate a consumer website's cache. Verify the public API and consumer page after publishing. The previous layout remains available for restoration through the existing authenticated editor; no API rollback or unpublish endpoint is added.

Only call this endpoint when publication is intended. Giving an agent this scope authorizes it to perform an explicit publication request without browser login. The scope does not itself grant draft-writing or asset access.
