import sanitizeHtml from 'sanitize-html';
import postcss from 'postcss';
import { validateInteractions, type ArticleInteraction } from './interactions';

export type FullPageDocument = { schemaVersion: 1 | 2; interactions?: ArticleInteraction[]; html: string; css: string; assets: { assetId: string; url: string; width: number; height: number; alt: string }[] };
const root = '.vb-full-page';
// Intentionally bounded CSS grammar: ordinary class/type selectors and media queries.
// No functions in selectors, nesting, imports, custom properties, or external resources.
export function validateFullPage(input: unknown, assetBase: string): FullPageDocument {
  const d = input as FullPageDocument;
  if (JSON.stringify(input)?.length > 400000) throw new Error('Document exceeds size limits');
  if (!d || ![1, 2].includes(d.schemaVersion) || typeof d.html !== 'string' || typeof d.css !== 'string' || !Array.isArray(d.assets)) throw new Error('Invalid full-page document');
  if (d.html.length > 250000 || d.css.length > 50000 || d.assets.length > 100) throw new Error('Document exceeds size limits');
  const base = new URL(assetBase);
  if (base.protocol !== 'https:') throw new Error('Asset endpoint must use HTTPS');
  const assets = new Map<string, FullPageDocument['assets'][number]>();
  for (const a of d.assets) {
    const u = new URL(a.url);
    if (u.origin !== base.origin || !u.pathname.startsWith(base.pathname.replace(/\/$/, '') + '/') || u.username || u.password || !a.assetId || !a.alt?.trim() || !Number.isInteger(a.width) || !Number.isInteger(a.height) || a.width <= 0 || a.height <= 0) throw new Error('Invalid managed asset');
    assets.set(a.url, a);
  }
  const interactions = validateInteractions(d.interactions, d.schemaVersion, d.assets, assetBase);
  const slots = new Map<string, number>();
  let headings = 0;
  let html = sanitizeHtml(d.html, {
    allowedTags: ['section','div','header','footer','h1','h2','h3','h4','h5','h6','p','span','strong','em','ul','ol','li','figure','figcaption','img','a','blockquote','table','thead','tbody','tr','th','td','caption','pre','code','br','hr'],
    allowedAttributes: { '*': ['class'], div: ['data-vb-interactive'], a: ['href','title'], img: ['src','alt','width','height','loading'], th: ['scope','colspan','rowspan'], td: ['colspan','rowspan'] },
    allowedSchemes: ['https','http','mailto'], allowProtocolRelative: false,
    transformTags: {
      div: (tag, attrs) => {
        if (!Object.hasOwn(attrs, 'data-vb-interactive')) return { tagName: tag, attribs: attrs };
        const id = attrs['data-vb-interactive'];
        if (!interactions.some(i => i.id === id)) throw new Error('Unknown interactive experience');
        slots.set(id, (slots.get(id) || 0) + 1);
        return { tagName: tag, attribs: { 'data-vb-interactive': id } };
      },
      h1: (tag, attrs) => { headings++; return { tagName: tag, attribs: attrs }; },
      img: (tag, attrs) => {
        const a = assets.get(attrs.src);
        if (!a) throw new Error('Image must reference a managed asset');
        return { tagName: tag, attribs: { src: a.url, alt: a.alt, width: String(a.width), height: String(a.height), loading: 'lazy' } };
      },
    },
  });
  for (const interaction of interactions) {
    const marker = `<div data-vb-interactive="${interaction.id}"></div>`;
    if (slots.get(interaction.id) !== 1 || !html.includes(marker)) throw new Error('Each interaction needs one empty placement div');
    html = html.replace(marker, () => `<div data-vb-interactive="${interaction.id}"><div class="vb-interactive-fallback">${interaction.fallbackHtml}</div></div>`);
  }
  if (headings !== 1) throw new Error('Full-page documents must contain exactly one H1');
  if (/[<>\\]/.test(d.css)) throw new Error('Unsupported CSS characters');
  const css = postcss.parse(d.css);
  css.walkAtRules(rule => {
    if (rule.name !== 'media' || !/^[a-z0-9\s():.\-]+$/i.test(rule.params)) throw new Error('Only simple media queries are allowed');
  });
  css.walkRules(rule => {
    if (rule.parent?.type !== 'root' && rule.parent?.type !== 'atrule') throw new Error('Nested selectors are not supported');
    rule.selector = rule.selectors.map(s => {
      if (!/^[a-zA-Z_.]/.test(s.trim()) || !/^[a-zA-Z0-9_.\s>+~:-]+$/.test(s) || /:(?!hover\b|focus\b|focus-visible\b|first-child\b|last-child\b)/.test(s) || /\b(html|body)\b/.test(s)) throw new Error('Unsupported CSS selector');
      return `${root} ${s}`;
    }).join(',');
  });
  css.walkDecls(d => {
    if (!/^(color|background-color|display|opacity|box-sizing|width|min-width|max-width|height|min-height|max-height|margin(-[a-z]+)?|padding(-[a-z]+)?|gap|row-gap|column-gap|grid-template-columns|grid-template-rows|grid-column|grid-row|grid-auto-flow|flex|flex-direction|flex-wrap|flex-grow|flex-shrink|flex-basis|align-items|align-self|align-content|justify-content|justify-items|order|font-family|font-size|font-weight|font-style|line-height|letter-spacing|text-align|text-decoration|text-transform|text-wrap|white-space|word-break|overflow-wrap|overflow|overflow-x|overflow-y|border(-[a-z]+)?|border-radius|box-shadow|object-fit|aspect-ratio|vertical-align|table-layout|border-collapse|border-spacing|list-style-type)$/.test(d.prop)) throw new Error('Unsupported CSS property: ' + d.prop);
    if (!d.parent || d.parent.type !== 'rule' || d.prop.startsWith('--') || !/^[a-z-]+$/.test(d.prop) || /[\\<>@]|url\s*\(|expression\s*\(|var\s*\(/i.test(d.value) || /^(position|z-index|behavior|content|animation.*|transition.*)$/i.test(d.prop)) throw new Error('Unsupported CSS declaration');
    d.important = false;
  });
  return { schemaVersion: d.schemaVersion, html, css: css.toString(), assets: d.assets, ...(interactions.length ? { interactions } : {}) };
}
