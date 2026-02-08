/**
 * ============================================
 * Field Nine OS: Google Sheets Connection Test
 * ============================================
 * Aesthetics: Tesla Style Code Base
 * Author: Jarvis (Field Nine CTO)
 * Date: 2026-01-24
 *
 * Usage: node scripts/test-sheets-connection.js
 * ============================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Field Nine Design System Constants
const WARM_IVORY = "#F9F9F7";
const DEEP_BLACK = "#171717";

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║     FIELD NINE OS: GOOGLE SHEETS CONNECTION TEST v1.0           ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log('║  Design System: WARM_IVORY ' + WARM_IVORY + ' | DEEP_BLACK ' + DEEP_BLACK + '  ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('\n');

async function testGoogleSheetsConnection() {
  console.log('[Step 1] Checking environment variables...\n');

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SALES_SPREADSHEET_ID;

  const checks = {
    'GOOGLE_SERVICE_ACCOUNT_EMAIL': email ? '✅ Set (' + email.substring(0, 20) + '...)' : '❌ Missing',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY': privateKey ? '✅ Set (key present)' : '❌ Missing',
    'GOOGLE_SALES_SPREADSHEET_ID': spreadsheetId ? '✅ ' + spreadsheetId : '❌ Missing'
  };

  Object.entries(checks).forEach(([key, status]) => {
    console.log(`  ${key}: ${status}`);
  });

  if (!email || !privateKey || !spreadsheetId) {
    console.log('\n❌ Missing required environment variables. Aborting test.');
    console.log('\nPlease ensure these are set in .env.local:');
    console.log('  - GOOGLE_SERVICE_ACCOUNT_EMAIL');
    console.log('  - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
    console.log('  - GOOGLE_SALES_SPREADSHEET_ID');
    process.exit(1);
  }

  console.log('\n[Step 2] Loading Google APIs...\n');

  let google;
  try {
    const googleapis = require('googleapis');
    google = googleapis.google;
    console.log('  ✅ googleapis package loaded');
  } catch (err) {
    console.log('  ❌ googleapis not installed. Run: npm install googleapis');
    process.exit(1);
  }

  console.log('\n[Step 3] Initializing Google Sheets API...\n');

  try {
    // Parse the private key (handle escaped newlines)
    const formattedKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: formattedKey
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('  ✅ Google Auth initialized');
    console.log('  ✅ Sheets API client created');

    console.log('\n[Step 4] Fetching spreadsheet metadata...\n');

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    console.log('  📊 Spreadsheet Title: ' + metadata.data.properties.title);
    console.log('  📋 Sheets:');
    metadata.data.sheets.forEach((sheet, i) => {
      console.log(`     ${i + 1}. ${sheet.properties.title}`);
    });

    console.log('\n[Step 5] Reading sample data from first sheet...\n');

    const firstSheet = metadata.data.sheets[0].properties.title;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `'${firstSheet}'!A1:E5`
    });

    const rows = response.data.values;
    if (rows && rows.length > 0) {
      console.log('  Sample Data (first 5 rows):');
      console.log('  ┌' + '─'.repeat(60) + '┐');
      rows.forEach((row, i) => {
        const rowStr = row.slice(0, 3).join(' | ').substring(0, 58);
        console.log(`  │ ${rowStr.padEnd(58)} │`);
      });
      console.log('  └' + '─'.repeat(60) + '┘');
    } else {
      console.log('  ⚠️ No data found in the sheet (empty or protected).');
    }

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                  CONNECTION TEST PASSED ✅                       ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  Google Sheets API is working correctly!                        ║');
    console.log('║  Service Account: ' + email.substring(0, 40).padEnd(40) + '   ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('\n');

  } catch (error) {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                  CONNECTION TEST FAILED ❌                       ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');

    const errorMsg = error.message || 'Unknown error';
    const lines = errorMsg.match(/.{1,54}/g) || [errorMsg];
    lines.slice(0, 3).forEach(line => {
      console.log('║  ' + line.padEnd(62) + '  ║');
    });

    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('Troubleshooting:');
    console.log('  1. Share the spreadsheet with the Service Account email');
    console.log('     → ' + email);
    console.log('  2. Verify the private key format (should have \\n for newlines)');
    console.log('  3. Check if Google Sheets API is enabled in Google Cloud Console');
    console.log('\n');
    process.exit(1);
  }
}

testGoogleSheetsConnection();
