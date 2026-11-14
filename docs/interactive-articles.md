# Custom layouts and interactive articles

VibeBlogger owns authoring, managed assets, private drafts, versioned publication and rollback. A destination integrates the renderer once. Each article continues to use its destination's navigation, footer, metadata, canonical URL and sitemap.

## Document contract

Version 1 custom layouts remain supported. Version 2 adds `interactions` to the existing `{schemaVersion,html,css,assets}` document. Each interaction has:

- `id`: unique lowercase identifier, e.g. `profitability`.
- `title`: accessible frame title.
- `html`, `css`, `js`: bespoke authored UI and behaviour. This is not a fixed block type.
- `fallbackHtml`: required readable explanation and worked example, server-rendered in the main article and visible to every reader.
- `initialHeight`: optional 160–2000 pixels; validated resize messages adjust it, capped at 2400 pixels. Long experiences can scroll inside the frame.

Place each interaction exactly once in the main HTML with `<div data-vb-interactive="profitability"></div>`. IDs, missing/duplicate placements, unregistered assets and invalid fallbacks are rejected. Maximum six experiences and 400,000 characters per article document. The API derives `articleMode: standard | interactive` independently of `renderMode: components | full_page`.

See `fixtures/consulting-profitability.json` for a complete article, calculator and worked example. Its article body remains useful without JavaScript. The default example is £6,000 fee, £600 direct costs, £300 overhead, 40 delivery hours, 10 admin hours and £60/hour internal time value: £2,100 surplus, 35% margin, £102/hour before time cost and £3,900 break-even fee.

## Authoring

Use the Custom article layout panel. Save the normal post as a draft first, paste the document JSON, validate/preview, then save the private full-page draft. Desktop/mobile previews execute the same isolated interaction documents used by the destination. Saving does not activate the public snapshot or publish a post.

The built-in VibeBlogger agent has `get_custom_article` and `save_custom_article_draft`. It can create a new private post or revise a draft with an expected revision. It cannot publish through these tools. Existing publication remains an explicit separate operation. FullPage.revision increments on saves and publication. Activation retains the previous published document, including all interaction code and asset references; Restore previous published layout swaps the snapshots after confirmation. Asset binaries are referenced, not copied: retain referenced media files.

## Customer integration

The reference implementation is `lib/blog/full-page.ts`, `lib/blog/interactions.ts`, `lib/blog/interaction-bridge.ts`, and Practice's `FullPage.tsx` / `InteractiveArticleBody.tsx`. Validate the raw stored document with the configured ImageKit account endpoint on the server. Validation returns scoped CSS and sanitised article HTML with static fallbacks. Pass the validated HTML through `embedInteractions` to add escaped sandbox documents. Render this HTML and CSS on the server; attach `handleInteractionMessage` to a container-scoped message listener on the client. Do not evaluate interaction JS in the customer page or on the server. Do not validate already-rendered HTML as if it were an authored document.

The private preview API still requires an explicit per-post API-key grant; the destination preview still requires its approved signed-in account. Drafts never appear in public APIs or listings. Published articles use the existing public endpoint and the activated published snapshot.

## Isolation and limits

The first runtime uses `srcdoc` with `sandbox="allow-scripts"`. Without allow-same-origin, each frame has a unique opaque security origin, even though no separate embed hostname is provisioned. There is no access to the parent's DOM, cookies or localStorage, and no bridge to application state or authenticated APIs. Popups, forms, top-level navigation and permissions such as camera/microphone are not enabled.

CSP blocks fetch/XHR/WebSocket, external scripts, fonts, nested frames, media, workers and form actions. Images are limited to the configured managed asset path. Inline authored JavaScript is allowed only inside the isolated document; CSS and JavaScript closing tags are escaped when constructing it. The message listener requires the actual frame window and matching identifier, checks message type, and bounds resize values. Authored code must be reviewed before publication: a sandbox is not a CPU budget or an absolute no-network environment (for example, self-navigation can still be attempted). Do not ask visitors for secrets or sensitive personal information in this initial runtime. External packages, persistence and server-side calculator calls are not supported.

The CMS preview is itself sandboxed with scripts enabled but without same-origin access. Its parent policy permits the child runtime; the child applies its own stricter CSP. If a destination has its own CSP, test that it permits the isolated inline document's nonce and required managed images. Never weaken the customer site's policy automatically.

## Events and SEO

An experience may call `window.VibeBlogger.event('started'|'completed'|'reset')`. The destination emits a local `vb:interaction` CustomEvent containing only `{id,action}`. There is no automatic analytics upload, persistence or collection of calculator inputs. Customers can connect these coarse events to their consent-aware analytics.

Main headings, article text, assumptions, formula and worked example remain in initial server-rendered HTML. The iframe is an enhancement; neither indexing nor usefulness depends on a crawler entering values. Private previews remain noindex/nofollow. This feature does not claim an SEO ranking boost.

## Verification

Run `node --import tsx scripts/test-interactive-articles.ts` in the Practice integration and the existing `scripts/test-blog-full-page.ts`. Tests cover legacy rendering, static fallback SSR, hostile HTML/script delimiters, placement validation, sandbox/CSP, source-bound messaging, bounded height, event privacy, and calculator normal/negative/zero/invalid inputs. Browser QA must also test keyboard inputs, mobile overflow, resizing and nested CMS preview execution.
