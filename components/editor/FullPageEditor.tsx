'use client';
import { useEffect, useState } from 'react';
const initial = { schemaVersion: 1, html: '<header><h1>Your article title</h1><p>Your introduction.</p></header>', css: 'header { padding: 48px 24px; } h1 { font-size: 48px; }', assets: [] };
export default function FullPageEditor({ postId }: { postId: string }) {
  const [source, setSource] = useState(JSON.stringify(initial, null, 2));
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState('');
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [imageAlt, setImageAlt] = useState('');
  useEffect(() => { let active = true; setReady(false); fetch(`/api/blog/posts/${postId}/full-page`, { cache: 'no-store' }).then(async r => { if (!r.ok) throw new Error('Could not load draft'); return r.json(); }).then(data => { if (active) { setSource(JSON.stringify(data.draft || initial, null, 2)); setReady(true); } }).catch(e => setMessage(e.message)); return () => { active = false; }; }, [postId]);
  async function run(action: string) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/blog/posts/${postId}/full-page`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, document: JSON.parse(source) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.rendered) setPreview(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>.vb-full-page{contain:layout paint;isolation:isolate;overflow-wrap:anywhere}.vb-full-page img{max-width:100%;height:auto}${result.rendered.css}</style></head><body><article class="vb-full-page">${result.rendered.html}</article></body></html>`);
      setMessage(action === 'save' ? 'Private full-page draft saved. Published content unchanged.' : action === 'publish' ? 'Full-page snapshot activated. The post must also be published to appear publicly.' : action === 'components' ? 'Component rendering restored.' : 'Preview updated with validated HTML and CSS.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Request failed'); } finally { setBusy(false); }
  }
  return <section className="bg-white rounded-xl border p-6 mb-6">
    <h2 className="text-lg font-semibold">Full-page design (optional)</h2>
    <p className="my-3">Design the hero, exactly one H1, and the entire article body. Paste a document containing schemaVersion, html, css and assets. CSS uses ordinary selectors and media queries; scripts, fixed positioning and external CSS resources are not supported. Saving here leaves the published article unchanged.</p>
    <button onClick={async () => { try { const r = await fetch('/api/images'); const data = await r.json(); if (!r.ok) throw new Error(data.error); setImages(data.images || []); } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not load images'); } }}>Browse managed images</button>
    <label>Image description<input aria-label="Image description" value={imageAlt} onChange={e => setImageAlt(e.target.value)} /></label>
    <div className="flex flex-wrap gap-3">{images.map(image => <button key={image.fileId} onClick={() => { try { const d = JSON.parse(source); const alt = imageAlt.trim(); if (!alt) { setMessage('Enter an image description before inserting.'); return; } d.assets = [...(d.assets || []).filter((a: any) => a.assetId !== image.fileId), { assetId: image.fileId, url: image.url, width: image.width, height: image.height, alt }]; d.html += '<figure><img src="' + image.url.replace(/"/g, '&quot;') + '"></figure>'; setSource(JSON.stringify(d, null, 2)); setPreview(''); } catch { setMessage('Correct the document JSON before inserting an image.'); } }}><img src={image.thumbnailUrl} alt={image.name} width={100} height={70} />Insert {image.name}</button>)}</div>
    <label htmlFor="full-page-source">Full-page document JSON</label>
    <textarea id="full-page-source" className="w-full border p-3 font-mono text-sm" rows={18} value={source} disabled={!ready} onChange={e => { setSource(e.target.value); setPreview(''); }} />
    <div className="flex flex-wrap gap-3 my-3">
      <button disabled={busy || !ready} onClick={() => run('preview')}>Validate and preview</button>
      <button disabled={busy || !ready} onClick={() => run('save')}>Save private full-page draft</button>
      <button disabled={busy || !ready || !preview} onClick={() => { if (window.confirm('Activate this reviewed full-page design for this post? Published posts will change publicly.')) run('publish'); }}>Activate full-page mode</button>
      <button disabled={busy || !ready} onClick={() => { if (window.confirm('Restore the existing component layout?')) run('components'); }}>Use component mode</button>
      <button onClick={() => setMobile(!mobile)}>{mobile ? 'Desktop preview' : 'Mobile preview'}</button>
    </div>
    <p role="status">{message}</p>
    {preview && <iframe title="Private full-page draft preview" sandbox="" srcDoc={preview} style={{ width: mobile ? 375 : '100%', maxWidth: '100%', height: 700, border: '1px solid #ddd' }} />}
    <p className="text-sm mt-3">Preview shows the article body. Practice supplies its own navigation, footer and fonts. Existing Save Draft and Publish buttons above still manage component content and post metadata.</p>
  </section>;
}
