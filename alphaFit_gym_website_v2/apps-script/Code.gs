const SHEET_NAME = "Bookings";

function doPost(e) {
  try {
    const sheet = getSheet_();
    ensureHeader_(sheet);

    const data = readInput_(e);
    sheet.appendRow([
      new Date(),
      data.name || "",
      data.email || "",
      data.phone || "",
      data.service || "",
      data.preferredDate || "",
      data.preferredTime || "",
      data.goal || "",
      data.message || ""
    ]);

    return json_({ ok: true, message: "Saved to Google Sheets" });
  } catch (error) {
    return json_({ ok: false, message: String(error) });
  }
}

function doGet() {
  return ContentService.createTextOutput("Gym booking endpoint is running.");
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Name",
      "Email",
      "Phone",
      "Service",
      "Preferred Date",
      "Preferred Time",
      "Goal",
      "Message"
    ]);
  }
}

function readInput_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      const parsed = JSON.parse(e.postData.contents);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return e.parameter || {};
    }
  }
  return e && e.parameter ? e.parameter : {};
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
