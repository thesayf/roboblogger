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
  const [canRestore, setCanRestore] = useState(false);
  let interactive = false; try { interactive = Boolean(JSON.parse(source).interactions?.length); } catch {}
  useEffect(() => { let active = true; setReady(false); fetch(`/api/blog/posts/${postId}/full-page`, { cache: 'no-store' }).then(async r => { if (!r.ok) throw new Error('Could not load draft'); return r.json(); }).then(data => { if (active) { setSource(JSON.stringify(data.draft || initial, null, 2)); setReady(true); setCanRestore(Boolean(data.previousPublished)); } }).catch(e => setMessage(e.message)); return () => { active = false; }; }, [postId]);
  async function run(action: string) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/blog/posts/${postId}/full-page`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, document: JSON.parse(source) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.previewHtml) setPreview(result.previewHtml);
      setMessage(action === 'save' ? 'Private full-page draft saved. Published content unchanged.' : action === 'publish' ? 'Full-page snapshot activated. The post must also be published to appear publicly.' : action === 'components' ? 'Component rendering restored.' : action === 'restore' ? 'Previous published layout restored.' : 'Preview updated with validated article and sandboxed interactions.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Request failed'); } finally { setBusy(false); }
  }
  return <section className="bg-white rounded-xl border p-6 mb-6">
    <h2 className="text-lg font-semibold">Custom article layout (optional)</h2>
    <p className="my-3">Design the hero, exactly one H1, and the entire article body. Paste a document containing schemaVersion, html, css and assets. For interactive articles, use schemaVersion 2 with an interactions array and empty placement divs using data-vb-interactive. Each experience supplies HTML, CSS, JavaScript and a readable fallbackHtml. JavaScript runs only inside an isolated sandbox, never in the surrounding website. Saving here leaves the published article unchanged.</p>
    <button onClick={async () => { try { const r = await fetch('/api/images'); const data = await r.json(); if (!r.ok) throw new Error(data.error); setImages(data.images || []); } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not load images'); } }}>Browse managed images</button>
    <label>Image description<input aria-label="Image description" value={imageAlt} onChange={e => setImageAlt(e.target.value)} /></label>
    <div className="flex flex-wrap gap-3">{images.map(image => <button key={image.fileId} onClick={() => { try { const d = JSON.parse(source); const alt = imageAlt.trim(); if (!alt) { setMessage('Enter an image description before inserting.'); return; } d.assets = [...(d.assets || []).filter((a: any) => a.assetId !== image.fileId), { assetId: image.fileId, url: image.url, width: image.width, height: image.height, alt }]; d.html += '<figure><img src="' + image.url.replace(/"/g, '&quot;') + '"></figure>'; setSource(JSON.stringify(d, null, 2)); setPreview(''); } catch { setMessage('Correct the document JSON before inserting an image.'); } }}><img src={image.thumbnailUrl} alt={image.name} width={100} height={70} />Insert {image.name}</button>)}</div>
    <button disabled={busy || !ready} onClick={() => {
      try {
        const d = JSON.parse(source); d.schemaVersion = 2; d.interactions = d.interactions || [];
        let n = d.interactions.length + 1; while (d.interactions.some((i: any) => i.id === `experience-${n}`)) n++;
        const id = `experience-${n}`;
        d.interactions.push({id,title:'Custom interactive experience',html:'<h2>Your interactive experience</h2><button id="demo">Try it</button><output id="result" aria-live="polite"></output>',css:'body { padding:24px; } button { padding:12px; }',js:'document.getElementById("demo").addEventListener("click", () => { document.getElementById("result").textContent = "It works. Replace this with your own experience."; });',fallbackHtml:'<p>Replace this with a useful explanation, assumptions and a worked example that readers can understand without using the interaction.</p>',initialHeight:320});
        d.html += `<div data-vb-interactive="${id}"></div>`; setSource(JSON.stringify(d,null,2)); setPreview('');
      } catch { setMessage('Correct the document JSON before adding an interaction.'); }
    }}>Add custom interaction</button>
    <p className="my-3 font-semibold">Article format: {interactive ? "Interactive" : "Standard"}</p>
    <label htmlFor="full-page-source">Full-page document JSON</label>
    <textarea id="full-page-source" className="w-full border p-3 font-mono text-sm" rows={18} value={source} disabled={!ready} onChange={e => { setSource(e.target.value); setPreview(''); }} />
    <div className="flex flex-wrap gap-3 my-3">
      <button disabled={busy || !ready} onClick={() => run('preview')}>Validate and preview</button>
      <button disabled={busy || !ready} onClick={() => run('save')}>Save private full-page draft</button>
      <button disabled={busy || !ready || !preview} onClick={() => { if (window.confirm('Activate this reviewed full-page design for this post? Published posts will change publicly.')) run('publish'); }}>Activate full-page mode</button>
      <button disabled={busy || !ready} onClick={() => { if (window.confirm('Restore the existing component layout?')) run('components'); }}>Use component mode</button>
      {canRestore && <button disabled={busy || !ready} onClick={() => { if (window.confirm('Restore the previous published custom layout? This changes the live design for published posts.')) run('restore'); }}>Restore previous published layout</button>}
      <button onClick={() => setMobile(!mobile)}>{mobile ? 'Desktop preview' : 'Mobile preview'}</button>
    </div>
    <p role="status">{message}</p>
    {preview && <iframe title="Private full-page draft preview" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={preview} style={{ width: mobile ? 375 : '100%', maxWidth: '100%', height: 700, border: '1px solid #ddd' }} />}
    <p className="text-sm mt-3">Preview shows the article body. Practice supplies its own navigation, footer and fonts. Existing Save Draft and Publish buttons above still manage component content and post metadata.</p>
  </section>;
}
