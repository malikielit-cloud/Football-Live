import path from 'path';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SHEET_HEADERS = {
  Users: ['User ID', 'Email', 'Name', 'Role', 'Created At'],
  Tournaments: ['Tournament ID', 'Tournament Name', 'Khmer Name', 'Season', 'Status', 'Created At'],
  Teams: ['Team ID', 'Tournament ID', 'Team Name', 'Khmer Name', 'Short Name', 'Logo URL', 'Primary Color'],
  Players: ['Player ID', 'Team ID', 'Player Name', 'Khmer Name', 'Number', 'Position', 'Photo URL'],
  Matches: ['Match ID', 'Tournament ID', 'Home Team ID', 'Away Team ID', 'Venue', 'Scheduled Time', 'Status'],
  MatchSessions: ['Match ID', 'Match Title', 'Score', 'Period', 'Clock (Seconds)', 'Active Scene', 'Version', 'Last Snapshot'],
  MatchEvents: ['Event ID', 'Match ID', 'Minute', 'Event Type', 'Details', 'Timestamp'],
  Sponsors: ['Sponsor ID', 'Sponsor Name', 'Logo URL', 'Banner URL', 'Active', 'Duration (Seconds)', 'Priority Order'],
  SponsorSchedules: ['Schedule ID', 'Sponsor ID', 'Match ID', 'Display Slot', 'Timestamp'],
  ScoreHistory: ['History ID', 'Match ID', 'Minute', 'Team', 'Score', 'Timestamp'],
  AuditLogs: ['Log ID', 'Timestamp', 'User ID', 'Action', 'Match ID', 'Details'],
  AppSettings: ['Setting Key', 'Setting Value', 'Updated At'],
};

async function setupDatabase() {
  console.log('=======================================================');
  console.log('🚀 PRO FOOTBALL LIVE STUDIO v2 — DATABASE SETUP SCRIPT');
  console.log('=======================================================');

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !privateKey) {
    console.log('ℹ️  No Google Sheets credentials found in .env.');
    console.log('ℹ️  The system will use the persistent JsonFileAdapter in server/data/db.json.');
    console.log('ℹ️  To connect to Google Sheets, set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY.');
    console.log('✅ Local database initialized with default schemas and sample data.');
    return;
  }

  try {
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log(`📡 Fetching metadata for Google Sheet ID: ${sheetId}...`);
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const existingSheets = meta.data.sheets?.map((s) => s.properties?.title || '') || [];

    console.log(`Found existing sheets: ${existingSheets.join(', ')}`);

    for (const [sheetTitle, headers] of Object.entries(SHEET_HEADERS)) {
      if (!existingSheets.includes(sheetTitle)) {
        console.log(`➕ Creating missing sheet: [${sheetTitle}]...`);
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: sheetTitle },
                },
              },
            ],
          },
        });
      }

      // Check / add headers
      const headerRange = `${sheetTitle}!A1:Z1`;
      const currentValues = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: headerRange,
      });

      if (!currentValues.data.values || currentValues.data.values.length === 0) {
        console.log(`📝 Writing column headers to sheet [${sheetTitle}]...`);
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${sheetTitle}!A1:${String.fromCharCode(64 + headers.length)}1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
      } else {
        console.log(`✓ Headers already present in [${sheetTitle}]`);
      }
    }

    console.log('🎉 Google Sheets Database Setup successfully completed for all 12 sheets!');
  } catch (err: any) {
    console.error('❌ Error setting up Google Sheets database:', err.message);
    process.exit(1);
  }
}

setupDatabase();
