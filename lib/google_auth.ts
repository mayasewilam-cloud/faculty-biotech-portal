import { JWT } from 'google-auth-library';
import { sheets as googleSheets, sheets_v4 } from '@googleapis/sheets';

export interface GoogleSheetsConfig {
  clientEmail: string;
  privateKey: string;
  spreadsheetId: string;
}

const DEFAULT_SPREADSHEET_ID = '18ptos5jsQWknMQUy9AEjhhyAlCvmlU_LreOlHALGUcA';

export function isGoogleSheetsConfigured(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || (globalThis as any).GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY || (globalThis as any).GOOGLE_PRIVATE_KEY;
  return Boolean(email && typeof email === 'string' && email.trim() && key && typeof key === 'string' && key.trim());
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || (globalThis as any).GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY || (globalThis as any).GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || (globalThis as any).GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;

  if (!email || !key) return null;

  // Handle escaped newlines in PEM private keys
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }

  return {
    clientEmail: email.trim(),
    privateKey: key.trim(),
    spreadsheetId: spreadsheetId.trim(),
  };
}

export function createGoogleAuthClient(): JWT | null {
  const config = getGoogleSheetsConfig();
  if (!config) return null;

  return new JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export function createSheetsClient(): sheets_v4.Sheets | null {
  const auth = createGoogleAuthClient();
  if (!auth) return null;

  return googleSheets({ version: 'v4', auth });
}

export async function validateSpreadsheetAccess(targetSpreadsheetId?: string): Promise<{
  available: boolean;
  spreadsheetTitle?: string;
  sheets?: Array<{ title: string; sheetId: number }>;
  error?: string;
  code?: string;
}> {
  if (!isGoogleSheetsConfigured()) {
    return {
      available: false,
      error: 'Google Service Account credentials are not configured on server.',
      code: 'UNCONFIGURED',
    };
  }

  const sheetsClient = createSheetsClient();
  if (!sheetsClient) {
    return {
      available: false,
      error: 'Failed to initialize Google Sheets API client.',
      code: 'AUTH_INIT_FAILED',
    };
  }

  const config = getGoogleSheetsConfig();
  const spreadsheetId = targetSpreadsheetId || config?.spreadsheetId || DEFAULT_SPREADSHEET_ID;

  try {
    const meta = await sheetsClient.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties(sheetId,title)',
    });

    const sheetsList = (meta.data.sheets || []).map(s => ({
      title: s.properties?.title || 'Untitled',
      sheetId: s.properties?.sheetId || 0,
    }));

    return {
      available: true,
      spreadsheetTitle: meta.data.properties?.title || 'Faculty Follow-up Tracker',
      sheets: sheetsList,
    };
  } catch (err: any) {
    let sanitizedError = err.message || 'Google Sheets API communication error';
    let code = err.code ? String(err.code) : 'API_ERROR';

    if (err.message && (err.message.includes('permission') || err.message.includes('403') || err.message.includes('The caller does not have permission'))) {
      sanitizedError = `Google Service Account (${config?.clientEmail}) does not have edit access to spreadsheet ${spreadsheetId}. Please share the spreadsheet with this email.`;
      code = 'PERMISSION_DENIED';
    } else if (err.message && (err.message.includes('not found') || err.message.includes('404'))) {
      sanitizedError = `Spreadsheet ID "${spreadsheetId}" was not found. Please verify the spreadsheet ID.`;
      code = 'NOT_FOUND';
    } else if (err.message && err.message.includes('invalid_grant')) {
      sanitizedError = 'Google Service Account authentication failed (invalid_grant: bad private key or clock skew).';
      code = 'INVALID_GRANT';
    }

    return {
      available: false,
      error: sanitizedError,
      code,
    };
  }
}
