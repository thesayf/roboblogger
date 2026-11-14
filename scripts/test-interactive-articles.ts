import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validateFullPage} from '../lib/blog/full-page';
import {embedInteractions,buildInteractionDocument,buildArticlePreview} from '../lib/blog/interactions';
import {handleInteractionMessage} from '../lib/blog/interaction-bridge';
const base='https://ik.imagekit.io/fo50ynfdm';
const fixture=JSON.parse(fs.readFileSync('fixtures/consulting-profitability.json','utf8'));
const d=validateFullPage(fixture,base);
assert.equal(d.interactions?.length,1);
assert(d.html.includes('£2,100'));
assert(!d.html.includes('<iframe'));
assert(!d.html.includes('<script'));
assert(!d.html.includes('computeProfitability'));
const src=buildInteractionDocument(d.interactions![0],base);
for(const directive of ["connect-src 'none'","form-action 'none'","frame-src 'none'","base-uri 'none'"]) assert(src.includes(directive));
const frameMarkup=embedInteractions(d.html,d.interactions!,base);
assert(frameMarkup.includes('sandbox="allow-scripts"'));
assert(!frameMarkup.includes('allow-same-origin'));
assert(!frameMarkup.includes('allow-forms'));
assert(frameMarkup.includes('referrerpolicy="no-referrer"'));
for(const changed of [
 {...fixture,schemaVersion:1},
 {...fixture,html:fixture.html.replace('data-vb-interactive="profitability"','data-vb-interactive="unknown"')},
 {...fixture,html:fixture.html.replace('<div data-vb-interactive="profitability"></div>','')},
 {...fixture,html:fixture.html+'<div data-vb-interactive="profitability"></div>'},
 {...fixture,html:fixture.html.replace('data-vb-interactive="profitability"></div>','data-vb-interactive="profitability">unexpected</div>')},
 {...fixture,interactions:[...fixture.interactions,...fixture.interactions]},
 {...fixture,interactions:[{...fixture.interactions[0],fallbackHtml:'<p>None</p>'}]},
 {...fixture,interactions:[{...fixture.interactions[0],id:'x" onload="alert(1)'}]},
 {...fixture,interactions:[{...fixture.interactions[0],initialHeight:100000}]},
]) assert.throws(()=>validateFullPage(changed,base));
const attack=validateFullPage({...fixture,interactions:[{...fixture.interactions[0],html:'<h2>Test</h2><script>parent.alert(1)</script><input oninput="alert(1)"><iframe src="https://evil.test"></iframe>',fallbackHtml:'<p>Enough readable fallback content to explain this useful example.<script>parent.alert(1)</script></p>',js:'const x="</script><script>parent.alert(1)</script>";',css:'p{color:red}/* </style><script>parent.alert(1)</script> */'}]},base);
assert(!attack.html.includes('<script'));
const attackDoc=buildInteractionDocument(attack.interactions![0],base);
assert.equal((attackDoc.match(/<script /g)||[]).length,2);
assert(!attack.interactions![0].html.includes('oninput'));
assert(!attack.interactions![0].html.includes('<iframe'));
const context:any={};vm.runInNewContext(fixture.interactions[0].js,context);
const inputs={fee:6000,directCosts:600,overhead:300,deliveryHours:40,adminHours:10,hourlyCost:60};
let r=context.computeProfitability(inputs);assert.equal(r.profit,2100);assert.equal(r.margin,35);assert.equal(r.effectiveRate,102);assert.equal(r.breakEvenFee,3900);
r=context.computeProfitability({...inputs,fee:3000});assert.equal(r.profit,-900);assert.equal(r.margin,-30);
r=context.computeProfitability({...inputs,deliveryHours:0,adminHours:0});assert.equal(r.effectiveRate,null);assert.equal(r.profit,5100);
r=context.computeProfitability({...inputs,fee:0});assert.equal(r.margin,null);
for(const bad of [-1,Infinity,NaN,100000001,'6000'])assert.throws(()=>context.computeProfitability({...inputs,fee:bad}));
const source={};const frame:any={contentWindow:source,dataset:{vbFrame:'profitability'},style:{},nextElementSibling:{textContent:''}};const events:any[]=[];
const root:any={querySelectorAll:()=>[frame],dispatchEvent:(e:any)=>events.push(e)};
const message=(data:any,override:any={})=>({origin:'null',source,data:{channel:'vb-interactive-v1',id:'profitability',...data},...override}) as MessageEvent;
handleInteractionMessage(root,message({type:'resize',height:700}));assert.equal(frame.style.height,'700px');
for(const override of [{source:{}},{origin:'https://evil.test'},{data:{channel:'vb-interactive-v1',id:'wrong',type:'resize',height:1200}}])handleInteractionMessage(root,message({type:'resize',height:1200},override));
assert.equal(frame.style.height,'700px');handleInteractionMessage(root,message({type:'resize',height:Infinity}));assert.equal(frame.style.height,'700px');handleInteractionMessage(root,message({type:'resize',height:999999}));assert.equal(frame.style.height,'2400px');
handleInteractionMessage(root,message({type:'event',action:'exfiltrate',value:'secret'}));assert.equal(events.length,0);
handleInteractionMessage(root,message({type:'event',action:'completed',value:'secret'}));assert.deepEqual(events[0].detail,{id:'profitability',action:'completed'});
handleInteractionMessage(root,message({type:'error'}));assert(frame.nextElementSibling.textContent.includes('worked example'));
assert(buildArticlePreview(d.html,d.css,d.interactions!,base).includes("addEventListener('message'"));
console.log('PASS: SSR fallback, isolated script documents, malicious payload handling, message-source checks, height limits, event privacy, calculator normal/zero/negative/invalid cases.');
