import { handleInteractionMessage } from './interaction-bridge';
import sanitizeHtml from 'sanitize-html';

export type ArticleInteraction = {
  id: string; title: string; html: string; css: string; js: string;
  fallbackHtml: string; initialHeight?: number;
};
type Asset = { url: string; alt: string; width: number; height: number };
const textTags = ['div','section','p','h2','h3','h4','span','strong','em','ul','ol','li','br','hr','table','thead','tbody','tr','th','td','caption','figure','figcaption','img','code','pre'];
export function validateInteractions(input: unknown, version: number, assets: Asset[], assetBase: string): ArticleInteraction[] {
  if (input === undefined) return [];
  if (version !== 2 || !Array.isArray(input) || input.length > 6) throw new Error('Interactions require schemaVersion 2; maximum six');
  const seen = new Set<string>();
  return input.map((i: ArticleInteraction) => {
    if (!i || typeof i.id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(i.id) || seen.has(i.id)) throw new Error('Interaction IDs must be unique lowercase identifiers');
    seen.add(i.id);
    for (const name of ['title','html','css','js','fallbackHtml'] as const) {
      if (typeof i[name] !== 'string' || !i[name].trim() || i[name].length > (name === 'title' ? 160 : 60000)) throw new Error('Invalid interaction ' + name);
    }
    if (i.initialHeight !== undefined && (!Number.isInteger(i.initialHeight) || i.initialHeight < 160 || i.initialHeight > 2000)) throw new Error('Initial height must be 160–2000');
    const img = (tag: string, attrs: Record<string,string>) => {
      const a = assets.find(a => a.url === attrs.src);
      if (!a || !new URL(a.url).href.startsWith(new URL(assetBase).href.replace(/\/$/, '') + '/')) throw new Error('Interaction image must be a managed asset');
      return { tagName: tag, attribs: {src:a.url,alt:a.alt,width:String(a.width),height:String(a.height)} };
    };
    const fallbackHtml = sanitizeHtml(i.fallbackHtml, { allowedTags:textTags, allowedAttributes:{'*':['class'],img:['src','alt','width','height'],th:['scope']}, transformTags:{img} });
    if (sanitizeHtml(fallbackHtml, {allowedTags:[],allowedAttributes:{}}).trim().length < 40) throw new Error('Add a readable static explanation and worked example');
    const html = sanitizeHtml(i.html, {
      allowedTags:[...textTags,'label','input','button','select','option','output','fieldset','legend','details','summary','canvas'],
      allowedAttributes:{'*':['class','id','role','aria-label','aria-labelledby','aria-describedby','aria-live','aria-hidden','tabindex'],label:['for'],input:['type','value','min','max','step','checked','placeholder','required','disabled'],button:['type','disabled'],select:['disabled'],option:['value','selected'],output:['for'],canvas:['width','height'],img:['src','alt','width','height'],th:['scope']},
      transformTags:{img, input:(tag,attrs) => ({tagName:tag,attribs:{...attrs,type:['number','range','checkbox','radio','text'].includes(attrs.type) ? attrs.type : 'text'}}),button:(tag,attrs)=>({tagName:tag,attribs:{...attrs,type:'button'}})},
    });
    // Authored JS is never evaluated here or in the parent document.
    return {id:i.id,title:i.title,html,css:i.css,js:i.js,fallbackHtml,initialHeight:i.initialHeight || 560};
  });
}
const attribute = (value: string) => value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const scriptText = (value: string) => value.replace(/<\/script/gi, '<\\/script');
export function buildInteractionDocument(i: ArticleInteraction, assetBase: string): string {
  const base = new URL(assetBase);
  const imageSource = base.origin + base.pathname.replace(/\/$/,'') + '/';
  const csp = `default-src 'none'; script-src 'nonce-vb-interactive-v1'; style-src 'unsafe-inline'; img-src ${imageSource}; connect-src 'none'; font-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  const bridge = `(()=>{const id=${JSON.stringify(i.id)};let queued=false;const send=(type,extra={})=>parent.postMessage({channel:'vb-interactive-v1',id,type,...extra},'*');const resize=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;send('resize',{height:Math.ceil(document.body.getBoundingClientRect().height)+2})})};new ResizeObserver(resize).observe(document.body);addEventListener('load',resize);addEventListener('error',()=>send('error'));addEventListener('unhandledrejection',()=>send('error'));Object.defineProperty(window,'VibeBlogger',{value:Object.freeze({event:action=>{if(['started','completed','reset'].includes(action))send('event',{action})}})});send('ready');resize();let n=0;const retry=setInterval(()=>{resize();if(++n===15)clearInterval(retry)},1000)})();`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${attribute(csp)}"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>${attribute(i.title)}</title><style>html{color-scheme:light}body{margin:0;display:flow-root;font-family:Arial,sans-serif;overflow-wrap:anywhere}*{box-sizing:border-box}img,canvas{max-width:100%;height:auto}input,select,button{font:inherit;max-width:100%}${i.css.replace(/<\/style/gi,'<\\/style')}</style></head><body>${i.html}<script nonce="vb-interactive-v1">${scriptText(bridge)}</script><script nonce="vb-interactive-v1">${scriptText(i.js)}</script></body></html>`;
}
export function embedInteractions(html: string, interactions: ArticleInteraction[], assetBase: string): string {
  for (const i of interactions) {
    const marker = `<div data-vb-interactive="${i.id}">`;
    const frame = `<iframe data-vb-frame="${i.id}" title="${attribute(i.title)}" sandbox="allow-scripts" referrerpolicy="no-referrer" loading="lazy" allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; payment 'none'" style="display:block;width:100%;height:${i.initialHeight || 560}px;border:0" srcdoc="${attribute(buildInteractionDocument(i,assetBase))}"></iframe><p data-vb-status="${i.id}" role="status"></p>`;
    html = html.replace(marker, () => marker + frame);
  }
  return html;
}

export function buildArticlePreview(html: string, css: string, interactions: ArticleInteraction[], assetBase: string): string {
  const body = embedInteractions(html,interactions,assetBase);
  const bootstrap = `const handle=${handleInteractionMessage.toString()};addEventListener('message',e=>handle(document.body,e));`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https://ik.imagekit.io; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-src about:; connect-src 'none'; base-uri 'none'; form-action 'none'"><style>body{margin:0}.vb-full-page{contain:layout paint;isolation:isolate;overflow-wrap:anywhere}.vb-full-page img{max-width:100%;height:auto}${css}</style></head><body><article class="vb-full-page">${body}</article><script nonce="vb-preview">${scriptText(bootstrap)}</script></body></html>`;
}
