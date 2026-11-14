// This self-contained listener is also serialized into the sandboxed CMS preview.
// No payload is forwarded except an enumerated action; input values never leave the frame.
export function handleInteractionMessage(root: HTMLElement, event: MessageEvent) {
  const data = event.data;
  if (event.origin !== 'null' || !data || data.channel !== 'vb-interactive-v1' || typeof data.id !== 'string') return;
  const frames = root.querySelectorAll<HTMLIFrameElement>('iframe[data-vb-frame]');
  let frame: HTMLIFrameElement | undefined;
  for (let n=0;n<frames.length;n++) if (frames[n].contentWindow === event.source && frames[n].dataset.vbFrame === data.id) frame = frames[n];
  if (!frame) return;
  if (data.type === 'resize' && typeof data.height === 'number' && Number.isFinite(data.height)) {
    frame.style.height = Math.max(160,Math.min(2400,Math.ceil(data.height))) + 'px';
  } else if (data.type === 'error') {
    const status = frame.nextElementSibling;
    if (status) status.textContent = 'The interactive tool could not run. The explanation and worked example remain available below.';
  } else if (data.type === 'event' && ['started','completed','reset'].includes(data.action)) {
    root.dispatchEvent(new CustomEvent('vb:interaction',{bubbles:true,detail:{id:data.id,action:data.action}}));
  }
}
