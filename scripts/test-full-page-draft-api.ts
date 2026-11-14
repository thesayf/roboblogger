import assert from 'node:assert/strict';
import fs from 'node:fs';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

async function main() {
  process.env.MONGODB_URI = 'mongodb://unused.invalid/test';
  process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test';
  (global as any).mongoose = { conn: mongoose, promise: null };
  const ApiKey = (await import('../models/ApiKey')).default;
  const BlogPost = (await import('../models/BlogPost')).default;
  const FullPage = (await import('../models/FullPage')).default;
  const helpers = await import('../lib/api/full-page-drafts');
  const { hasApiPermission } = await import('../lib/auth/validateApiKey');
  const drafts = await import('../app/api/v1/full-page/drafts/route');
  const draft = await import('../app/api/v1/full-page/drafts/[id]/route');
  const validate = await import('../app/api/v1/full-page/validate/route');
  const assets = await import('../app/api/v1/assets/route');
  const ownerId = '111111111111111111111111', id = '222222222222222222222222';
  let permissions = ['full-page:write'];
  (ApiKey as any).findOne = async () => ({ _id: id, owner: ownerId, isActive: true, permissions, rateLimit: 10000 });
  (ApiKey as any).updateOne = () => ({ exec: async () => ({}) });
  const source = JSON.parse(fs.readFileSync('fixtures/consulting-profitability.json','utf8'));
  const request = (body: any, method = 'POST', key = true) => new NextRequest('https://test.local/api', { method, headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: 'Bearer rb_live_test' } : {}) }, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) });
  assert.equal((await validate.POST(request({document:source},'POST',false)))?.status,401);
  for (const denied of [['read'], ['write'], ['posts:read'], ['topics:write'], ['read','write']]) {
    permissions=denied;
    assert(!hasApiPermission({permissions} as any,'full-page:write'));
    assert.equal((await validate.POST(request({document:source})))?.status,403);
    assert.equal((await drafts.POST(request({document:source})))?.status,403);
    assert.equal((await assets.GET(request(null,'GET')))?.status,403);
  }
  permissions=['full-page:write'];
  const valid=await validate.POST(request({document:source})); assert.equal(valid?.status,200);
  assert.match(valid!.headers.get('cache-control')!,/no-store/);
  const normalized=(await valid!.json()).document;
  assert(!normalized.html.includes('<script')); assert(normalized.interactions[0].js);
  assert.equal((await validate.POST(request({document:{...source,html:'<p>No heading</p>'}})))?.status,422);
  for (const extra of [{status:'published'},{action:'publish'},{enabled:true},{owner:'other'},{published:source}]) {
    assert.equal((await drafts.POST(request({title:'Test',description:'Test',slug:'test',document:source,...extra})))?.status,400);
  }
  let post:any={_id:id,owner:ownerId,status:'draft',slug:'test',title:'Test'};
  let design:any={post:id,revision:2,draft:source,enabled:false};
  const match=(f:any)=>post && String(f._id)===id && f.owner===post.owner && f.status===post.status;
  (BlogPost as any).findOne=(f:any)=>({lean:async()=>match(f)?post:null});
  (BlogPost as any).exists=async(f:any)=>match(f)?{_id:id}:null;
  (BlogPost as any).findOneAndUpdate=async(f:any)=>match(f)?post:null;
  (FullPage as any).findOne=()=>({lean:async()=>design});
  (FullPage as any).exists=()=>({session:async()=>design?{_id:id}:null});
  (FullPage as any).findOneAndUpdate=async(f:any,u:any)=>{
    assert.deepEqual(Object.keys(u.$set),['draft']); assert.equal(u.$inc.revision,1);
    if(f.revision!==design.revision)return null;
    design={...design,draft:u.$set.draft,revision:design.revision+1};return design;
  };
  (mongoose as any).startSession=async()=>({withTransaction:async(fn:any)=>fn(),endSession:async()=>{}});
  assert.equal((await draft.GET(request(null,'GET'),{params:{id}}))?.status,200);
  assert.equal((await draft.PATCH(request({document:source},'PATCH'),{params:{id}}))?.status,400);
  assert.equal((await draft.PATCH(request({document:source,expectedRevision:1},'PATCH'),{params:{id}}))?.status,409);
  assert.equal((await draft.PATCH(request({document:source,expectedRevision:2},'PATCH'),{params:{id}}))?.status,200);
  assert.equal(design.revision,3);assert.equal(design.enabled,false);assert.equal(design.published,undefined);
  assert.equal((await draft.PATCH(request({document:source,expectedRevision:2},'PATCH'),{params:{id}}))?.status,409);
  post.owner='333333333333333333333333';
  assert.equal((await draft.GET(request(null,'GET'),{params:{id}}))?.status,404);
  assert.equal((await draft.PATCH(request({document:source,expectedRevision:3},'PATCH'),{params:{id}}))?.status,404);
  post.owner=ownerId;post.status='published';
  assert.equal((await draft.PATCH(request({document:source,expectedRevision:3},'PATCH'),{params:{id}}))?.status,404);
  assert(helpers.isOwnerAsset({filePath:`/blog-images/${ownerId}/test.png`,fileType:'image'},ownerId));
  assert(!helpers.isOwnerAsset({filePath:`/blog-images/${ownerId}other/test.png`,fileType:'image'},ownerId));
  assert(!helpers.isOwnerAsset({filePath:'/blog-images/other/test.png',fileType:'image'},ownerId));
  assert.equal((await assets.POST(request({fileName:'test.png',fileBase64:'https://internal.test',alt:'Test'})))?.status,400);
  assert.equal((await assets.POST(request({fileName:'test.png',fileBase64:Buffer.from('<script>bad</script>').toString('base64'),alt:'Test'})))?.status,415);
  await assert.rejects(()=>helpers.readJson(request({long:'a'.repeat(200)}),100),{status:413});
  console.log('PASS: exact permission, auth, validation, strict publication-field rejection, owner isolation, published-post refusal, revision conflict, private-only updates, upload rejection and bounded body.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
