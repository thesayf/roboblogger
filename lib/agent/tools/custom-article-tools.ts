import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolContext } from '../types';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import FullPage from '@/models/FullPage';
import { validateFullPage } from '@/lib/blog/full-page';

export function buildCustomArticleTools(ctx: ToolContext) {
  return [
    betaZodTool({
      name:'get_custom_article',
      description:'Read an owner-matching custom article draft and its revision. Includes authored HTML/CSS and optional sandboxed JavaScript experiences. Does not publish or change anything.',
      inputSchema:z.object({postId:z.string()}),
      run:async ({postId})=>{
        try {
          await dbConnect();
          if (!await BlogPost.exists({_id:postId,owner:ctx.userId})) return JSON.stringify({error:'Post not found'});
          const design=await FullPage.findOne({post:postId}).lean() as any;
          return JSON.stringify({draft:design?.draft || null,revision:design?.revision || 0,enabled:Boolean(design?.enabled)});
        } catch { return JSON.stringify({error:'Could not read custom article'}); }
      },
    }),
    betaZodTool({
      name:'save_custom_article_draft',
      description:'Create or save a PRIVATE custom article draft. NEVER publishes or activates a layout. Pass documentJson with schemaVersion 1 for HTML/CSS, or 2 for interactive articles. Both need html (exactly one H1), css, assets [{assetId,url,width,height,alt}]. Version 2 adds interactions [{id,title,html,css,js,fallbackHtml,initialHeight}]. Place each experience once with <div data-vb-interactive="id"></div> in the main html. Main article scripts are forbidden; custom JS runs only in the sandbox. fallbackHtml must contain a meaningful static explanation and worked example. No network calls, forms, external libraries or customer-app access. Use get_media_images for managed assets. Read get_custom_article before editing and pass expectedRevision to avoid overwriting another edit. For a new draft omit postId and provide title, description, slug.',
      inputSchema:z.object({postId:z.string().optional(),expectedRevision:z.number().int().nonnegative().optional(),title:z.string().max(200).optional(),description:z.string().max(320).optional(),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160).optional(),documentJson:z.string().max(400000)}),
      run:async input=>{
        try {
          const document=JSON.parse(input.documentJson);
          const validated=validateFullPage(document,process.env.IMAGEKIT_URL_ENDPOINT || '');
          await dbConnect();
          let post:any;
          if(input.postId){
            post=await BlogPost.findOne({_id:input.postId,owner:ctx.userId});
            if(!post)return JSON.stringify({error:'Post not found'});
            if(input.expectedRevision===undefined)return JSON.stringify({error:'Read the current draft and supply expectedRevision before editing'});
          } else {
            if(!input.title?.trim()||!input.description?.trim()||!input.slug)return JSON.stringify({error:'New drafts need title, description and slug'});
            post=await BlogPost.create({title:input.title,description:input.description,slug:input.slug,owner:ctx.userId,author:ctx.userId,status:'draft',components:[]});
          }
          const query:any={post:post._id};
          if(input.postId)query.$or=input.expectedRevision===0?[{revision:0},{revision:{$exists:false}}]:[{revision:input.expectedRevision}];
          const exists=await FullPage.exists({post:post._id});
          // If no document exists, the unique post index prevents concurrent first-save overwrites.
          const saved=await FullPage.findOneAndUpdate(query,{$set:{draft:document},$inc:{revision:1}},{upsert:!exists,new:true});
          if(!saved)return JSON.stringify({error:'Draft changed since it was read; reload before saving'});
          ctx.dataChanged.push('posts');
          return JSON.stringify({success:true,postId:String(post._id),slug:post.slug,revision:saved.revision,articleMode:validated.interactions?.length?'interactive':'standard',editorUrl:`https://vibeblogger.io/blog/admin/manual?edit=${post._id}`,message:'Private draft saved. Published content unchanged.'});
        } catch(e) {return JSON.stringify({error:e instanceof Error?e.message:'Could not save custom article'});}
      },
    }),
  ];
}
