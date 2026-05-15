/**
 * Google Apps Script – Web App for Smaka på Älvsjö feedback
 *
 * Setup:
 * 1. Go to https://script.google.com and create a new project.
 * 2. Paste this entire file into the editor.
 * 3. Replace SHEET_ID below with your Google Sheet ID
 *    (the long ID in the sheet URL: /spreadsheets/d/<SHEET_ID>/edit).
 * 4. Click Deploy → New deployment → Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployment URL and set it as
 *    NEXT_PUBLIC_APPS_SCRIPT_URL in your .env.local file.
 *
 * The sheet will have columns:
 * Timestamp | Group | Restaurant | Rating | Comment
 */

const SHEET_ID = "1i7Slkpl_aggiENivtayiQNc7SduBSQeWkcLzQpNM0EQ";
const SHEET_NAME = "Feedback";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    const sheet =
      SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME) ||
      SpreadsheetApp.openById(SHEET_ID).insertSheet(SHEET_NAME);

    // Add header row if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Group",
        "Restaurant",
        "Rating",
        "Comment",
      ]);
    }

    sheet.appendRow([
      body.timestamp || new Date().toISOString(),
      body.group || "",
      body.restaurantName || "",
      body.rating ?? "",
      body.comment || "",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, reviews: [] }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const rows = sheet.getDataRange().getValues();
    const reviews = rows.slice(1).map((row) => ({
      timestamp: row[0] || "",
      group: row[1] || "",
      restaurantName: row[2] || "",
      rating: row[3] ?? "",
      comment: row[4] || "",
    }));

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, reviews }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
