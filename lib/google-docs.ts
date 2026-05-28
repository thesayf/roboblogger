import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/webmasters.readonly',
];

// ── OAuth helpers ────────────────────────────────────────

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_DOCS_CLIENT_ID,
    process.env.GOOGLE_DOCS_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/google/callback`
  );
}

function getAuthenticatedClient(refreshToken: string) {
  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export function getGoogleAuthUrl(state: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ refreshToken: string; email: string }> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error('No refresh token returned. User may need to re-authorize.');
  }

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();

  return {
    refreshToken: tokens.refresh_token,
    email: data.email || 'unknown',
  };
}

export async function revokeGoogleAccess(refreshToken: string): Promise<void> {
  const client = getOAuth2Client();
  try {
    await client.revokeToken(refreshToken);
  } catch (error) {
    console.error('Failed to revoke Google token (best-effort):', error);
  }
}

// ── Google Docs operations ───────────────────────────────

export async function createGoogleDoc(
  refreshToken: string,
  title: string
): Promise<{ docId: string; docUrl: string }> {
  const auth = getAuthenticatedClient(refreshToken);
  const docs = google.docs({ version: 'v1', auth });

  const doc = await docs.documents.create({
    requestBody: { title },
  });

  const docId = doc.data.documentId!;
  const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

  return { docId, docUrl };
}

export async function readGoogleDoc(
  refreshToken: string,
  docId: string
): Promise<string> {
  const auth = getAuthenticatedClient(refreshToken);
  const docs = google.docs({ version: 'v1', auth });

  const doc = await docs.documents.get({ documentId: docId });
  const body = doc.data.body;

  if (!body?.content) return '';

  let text = '';
  for (const element of body.content) {
    if (element.paragraph?.elements) {
      for (const el of element.paragraph.elements) {
        if (el.textRun?.content) {
          text += el.textRun.content;
        }
      }
    }
    if (element.table) {
      for (const row of element.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          for (const cellContent of cell.content || []) {
            if (cellContent.paragraph?.elements) {
              for (const el of cellContent.paragraph.elements) {
                if (el.textRun?.content) {
                  text += el.textRun.content;
                }
              }
            }
          }
          text += '\t';
        }
        text += '\n';
      }
    }
  }

  return text.trim();
}

export async function writeGoogleDoc(
  refreshToken: string,
  docId: string,
  content: string
): Promise<void> {
  const auth = getAuthenticatedClient(refreshToken);
  const docs = google.docs({ version: 'v1', auth });

  const doc = await docs.documents.get({ documentId: docId });
  const body = doc.data.body;
  const endIndex = body?.content
    ? body.content[body.content.length - 1]?.endIndex || 1
    : 1;

  const requests: any[] = [];

  if (endIndex > 2) {
    requests.push({
      deleteContentRange: {
        range: { startIndex: 1, endIndex: endIndex - 1 },
      },
    });
  }

  if (content) {
    requests.push({
      insertText: {
        location: { index: 1 },
        text: content,
      },
    });
  }

  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });
  }
}

// ── Google Sheets operations ─────────────────────────────

export async function createGoogleSheet(
  refreshToken: string,
  title: string
): Promise<{ sheetId: string; sheetUrl: string }> {
  const auth = getAuthenticatedClient(refreshToken);
  const drive = google.drive({ version: 'v3', auth });

  // Create via Drive API (covered by drive.file scope) instead of Sheets API
  const file = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: 'application/vnd.google-apps.spreadsheet',
    },
    fields: 'id',
  });

  const sheetId = file.data.id!;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  return { sheetId, sheetUrl };
}

export async function readGoogleSheet(
  refreshToken: string,
  spreadsheetId: string,
  range?: string
): Promise<{
  title: string;
  sheets: Array<{ name: string; data: string[][] }>;
}> {
  const auth = getAuthenticatedClient(refreshToken);
  const sheets = google.sheets({ version: 'v4', auth });

  // Get spreadsheet metadata
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const title = meta.data.properties?.title || 'Untitled';
  const sheetNames = (meta.data.sheets || []).map(
    (s) => s.properties?.title || 'Sheet1'
  );

  const result: Array<{ name: string; data: string[][] }> = [];

  if (range) {
    // Read specific range
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    result.push({
      name: range.split('!')[0] || 'Sheet1',
      data: (res.data.values || []).slice(0, 500) as string[][],
    });
  } else {
    // Read all sheets (cap at 500 rows each)
    const ranges = sheetNames.map((name) => `'${name}'!A:ZZ`);
    if (ranges.length > 0) {
      const res = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });
      (res.data.valueRanges || []).forEach((vr, i) => {
        result.push({
          name: sheetNames[i],
          data: (vr.values || []).slice(0, 500) as string[][],
        });
      });
    }
  }

  return { title, sheets: result };
}

export async function writeGoogleSheet(
  refreshToken: string,
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<{ updatedCells: number }> {
  const auth = getAuthenticatedClient(refreshToken);
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  return { updatedCells: res.data.updatedCells || 0 };
}

// ── Google Drive operations ──────────────────────────────

export async function shareDocument(
  refreshToken: string,
  fileId: string
): Promise<void> {
  const auth = getAuthenticatedClient(refreshToken);
  const drive = google.drive({ version: 'v3', auth });

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'writer',
      type: 'anyone',
    },
  });
}

export async function deleteDocument(
  refreshToken: string,
  fileId: string
): Promise<void> {
  const auth = getAuthenticatedClient(refreshToken);
  const drive = google.drive({ version: 'v3', auth });

  await drive.files.delete({ fileId });
}
