import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolContext, ToolCallInfo } from '../types';
import dbConnect from '@/lib/mongo';
import LinkedDocument from '@/models/LinkedDocument';
import GoogleIntegration from '@/models/GoogleIntegration';
import {
  createGoogleDoc,
  createGoogleSheet,
  readGoogleDoc,
  writeGoogleDoc,
  readGoogleSheet,
  writeGoogleSheet,
  shareDocument,
  deleteDocument,
} from '@/lib/google-docs';

function wrapTool(ctx: ToolContext, toolName: string, fn: (input: any) => Promise<string>) {
  return async (input: any): Promise<string> => {
    const callInfo: ToolCallInfo = { name: toolName, input, success: false };
    ctx.toolCalls.push(callInfo);
    ctx.sendEvent('tool_start', { toolName, toolInput: input });

    try {
      const result = await fn(input);
      callInfo.result = result;
      callInfo.success = true;
      ctx.sendEvent('tool_end', { toolName, success: true });
      return result;
    } catch (error: any) {
      callInfo.success = false;
      ctx.sendEvent('tool_end', { toolName, success: false });
      return JSON.stringify({ error: error.message });
    }
  };
}

async function getIntegration(clerkId: string) {
  const integration = await GoogleIntegration.findOne({ userId: clerkId }).lean() as any;
  if (!integration) {
    throw new Error('Google not connected. Ask the user to connect Google in the Documents tab first.');
  }
  return integration;
}

export function buildDocumentTools(ctx: ToolContext) {
  return [
    betaZodTool({
      name: 'list_documents',
      description: 'List all linked Google Docs and Sheets for the current user.',
      inputSchema: z.object({}),
      run: wrapTool(ctx, 'list_documents', async () => {
        await dbConnect();

        const docs = await LinkedDocument.find({ owner: ctx.userId })
          .sort({ createdAt: -1 })
          .lean();

        if (docs.length === 0) {
          return JSON.stringify({ documents: [], message: 'No documents linked yet.' });
        }

        const result = (docs as any[]).map((d) => ({
          id: d._id.toString(),
          name: d.name,
          type: d.type,
          googleUrl: d.googleUrl,
          lastAccessedAt: d.lastAccessedAt,
          createdAt: d.createdAt,
        }));

        return JSON.stringify({ documents: result, count: result.length });
      }),
    }),

    betaZodTool({
      name: 'create_document',
      description: 'Create a new Google Doc or Google Sheet. Returns a shareable link.',
      inputSchema: z.object({
        name: z.string().describe('Document title'),
        type: z.enum(['google_doc', 'google_sheet']).describe('Document type'),
        content: z.string().optional().describe('Initial content (for Google Docs only)'),
        sheetNames: z.array(
          z.string()
            .min(1)
            .max(100)
            .refine(
              (name) => !['[', ']', ':', '*', '?', '/', '\\'].some((character) => name.includes(character)),
              'Sheet names cannot contain [ ] : * ? / or \\'
            )
        ).max(10).optional().describe('For Google Sheets only: up to 10 named tabs to create in order.'),
      }),
      run: wrapTool(ctx, 'create_document', async (input) => {
        await dbConnect();
        const integration = await getIntegration(ctx.clerkId);

        let googleId: string;
        let googleUrl: string;

        if (input.type === 'google_sheet') {
          const result = await createGoogleSheet(integration.refreshToken, input.name, input.sheetNames);
          googleId = result.sheetId;
          googleUrl = result.sheetUrl;
        } else {
          const result = await createGoogleDoc(integration.refreshToken, input.name);
          googleId = result.docId;
          googleUrl = result.docUrl;

          if (input.content) {
            await writeGoogleDoc(integration.refreshToken, googleId, input.content);
          }
        }

        await shareDocument(integration.refreshToken, googleId);

        const doc = new LinkedDocument({
          owner: ctx.userId,
          ownerClerkId: ctx.clerkId,
          name: input.name,
          type: input.type,
          googleId,
          googleUrl,
          metadata: { title: input.name },
        });
        await doc.save();

        ctx.dataChanged.push('documents');
        return JSON.stringify({
          success: true,
          document: {
            id: doc._id.toString(),
            name: doc.name,
            type: input.type,
            googleUrl,
          },
          message: `${input.type === 'google_sheet' ? 'Sheet' : 'Doc'} "${input.name}" created. Link: ${googleUrl}`,
        });
      }),
    }),

    betaZodTool({
      name: 'read_document',
      description: 'Read the content of a linked Google Doc or Sheet. For sheets, optionally specify a range (e.g. "Sheet1!A1:D10").',
      inputSchema: z.object({
        documentId: z.string().describe('Document ID (the linked document ID, not the Google ID)'),
        range: z.string().optional().describe('For sheets: cell range like "Sheet1!A1:D10". Omit to read all.'),
      }),
      run: wrapTool(ctx, 'read_document', async (input) => {
        await dbConnect();
        const integration = await getIntegration(ctx.clerkId);

        const doc = await LinkedDocument.findOne({ _id: input.documentId, owner: ctx.userId }).lean() as any;
        if (!doc) {
          return JSON.stringify({ error: 'Document not found.' });
        }

        doc.lastAccessedAt = new Date();
        await LinkedDocument.updateOne({ _id: input.documentId }, { $set: { lastAccessedAt: new Date() } });

        if (doc.type === 'google_sheet') {
          const data = await readGoogleSheet(integration.refreshToken, doc.googleId, input.range);
          return JSON.stringify({
            name: doc.name,
            type: 'google_sheet',
            googleUrl: doc.googleUrl,
            ...data,
          });
        } else {
          const content = await readGoogleDoc(integration.refreshToken, doc.googleId);
          return JSON.stringify({
            name: doc.name,
            type: 'google_doc',
            googleUrl: doc.googleUrl,
            content,
          });
        }
      }),
    }),

    betaZodTool({
      name: 'write_document',
      description: 'Write content to a Google Doc or Sheet. For docs: replaces content (or appends with append=true). For sheets: writes values to a range.',
      inputSchema: z.object({
        documentId: z.string().describe('Document ID'),
        content: z.string().optional().describe('For docs: text content to write'),
        append: z.boolean().optional().describe('For docs: append instead of replace'),
        range: z.string().optional().describe('For sheets: target range like "Sheet1!A1:D10"'),
        values: z.array(z.array(z.string())).optional().describe('For sheets: 2D array of cell values'),
      }),
      run: wrapTool(ctx, 'write_document', async (input) => {
        await dbConnect();
        const integration = await getIntegration(ctx.clerkId);

        const doc = await LinkedDocument.findOne({ _id: input.documentId, owner: ctx.userId }).lean() as any;
        if (!doc) {
          return JSON.stringify({ error: 'Document not found.' });
        }

        if (doc.type === 'google_sheet') {
          if (!input.range || !input.values) {
            return JSON.stringify({ error: 'range and values are required for sheets.' });
          }
          const result = await writeGoogleSheet(integration.refreshToken, doc.googleId, input.range, input.values);
          ctx.dataChanged.push('documents');
          return JSON.stringify({
            success: true,
            updatedCells: result.updatedCells,
            message: `Updated ${result.updatedCells} cells in "${doc.name}".`,
          });
        } else {
          if (input.content === undefined) {
            return JSON.stringify({ error: 'content is required for docs.' });
          }

          let finalContent = input.content;
          if (input.append) {
            const existing = await readGoogleDoc(integration.refreshToken, doc.googleId);
            finalContent = existing + '\n' + input.content;
          }

          await writeGoogleDoc(integration.refreshToken, doc.googleId, finalContent);
          ctx.dataChanged.push('documents');
          return JSON.stringify({
            success: true,
            message: `Document "${doc.name}" ${input.append ? 'appended' : 'updated'}.`,
          });
        }
      }),
    }),

    betaZodTool({
      name: 'delete_document',
      description: 'Delete a linked document. Removes it from the app and attempts to delete from Google Drive.',
      inputSchema: z.object({
        documentId: z.string().describe('Document ID to delete'),
      }),
      run: wrapTool(ctx, 'delete_document', async (input) => {
        await dbConnect();

        const doc = await LinkedDocument.findOne({ _id: input.documentId, owner: ctx.userId }).lean() as any;
        if (!doc) {
          return JSON.stringify({ error: 'Document not found.' });
        }

        try {
          const integration = await getIntegration(ctx.clerkId);
          await deleteDocument(integration.refreshToken, doc.googleId);
        } catch {
          // Best-effort Drive deletion
        }

        await LinkedDocument.findOneAndDelete({ _id: input.documentId, owner: ctx.userId });

        ctx.dataChanged.push('documents');
        return JSON.stringify({
          success: true,
          message: `Document "${doc.name}" deleted.`,
        });
      }),
    }),
  ];
}
