
# Employee Management System (EMS)

A high-performance, responsive web application built with React, Bootstrap 5, and Vite, using Google Sheets as a remote database.

## 🚀 Google Sheets Integration Setup

To use your Google Sheet as a database, follow these steps exactly:

### 1. Prepare your Google Sheet
Ensure your Google Sheet (ID: `1ESYHbrrjiTOFY49P9KXzOoGEJQPSGgWOE6JA-vNIFdU`) has the following tab names:
- `User`
- `Department`
- `Office`
- `Bank`
- `Bank_Branch`
- `Post`
- `Payscale`
- `Employee`
- `UserPostSelections`

### 2. Deploy the Google Apps Script
1. Open your Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Replace the entire code with the following snippet:

```javascript
/**
 * GOOGLE APPS SCRIPT FOR EMS SYSTEM
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

function doGet() {
  const tables = ['User', 'Department', 'Office', 'Bank', 'Bank_Branch', 'Post', 'Payscale', 'Employee'];
  const data = {};
  
  tables.forEach(name => {
    const sheet = SS.getSheetByName(name);
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      const headers = rows.shift();
      data[name.toLowerCase() + 's'] = rows.map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      });
    } else {
      data[name.toLowerCase() + 's'] = [];
    }
  });

  // Special handling for UserPostSelections (Object)
  const upsSheet = SS.getSheetByName('UserPostSelections');
  const selections = {};
  if (upsSheet) {
    const rows = upsSheet.getDataRange().getValues();
    rows.shift(); // remove headers
    rows.forEach(row => {
      selections[row[0]] = JSON.parse(row[1] || '[]');
    });
  }
  data.userPostSelections = selections;

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const req = JSON.parse(e.postData.contents);
  const action = req.action;
  const payload = req.payload;

  switch(action) {
    case 'upsertEmployee': upsertRow('Employee', 'Employee_ID', payload); break;
    case 'deleteEmployee': deleteRow('Employee', 'Employee_ID', payload.Employee_ID); break;
    case 'upsertOffice': upsertRow('Office', 'Office_ID', payload); break;
    case 'upsertBank': upsertRow('Bank', 'Bank_ID', payload); break;
    case 'upsertBranch': upsertRow('Bank_Branch', 'Branch_ID', payload); break;
    case 'updatePostSelections': updatePostSelections(payload); break;
  }

  return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function upsertRow(sheetName, idColumnName, data) {
  const sheet = SS.getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIndex = headers.indexOf(idColumnName);
  
  let targetRow = -1;
  for(let i = 1; i < rows.length; i++) {
    if(rows[i][idIndex] == data[idColumnName]) {
      targetRow = i + 1;
      break;
    }
  }

  const rowValues = headers.map(h => data[h] !== undefined ? data[h] : '');
  if(targetRow > -1) {
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteRow(sheetName, idColumnName, idValue) {
  const sheet = SS.getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIndex = headers.indexOf(idColumnName);
  for(let i = 1; i < rows.length; i++) {
    if(rows[i][idIndex] == idValue) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function updatePostSelections(payload) {
  const sheet = SS.getSheetByName('UserPostSelections');
  const rows = sheet.getDataRange().getValues();
  let found = false;
  for(let i = 1; i < rows.length; i++) {
    if(rows[i][0] == payload.User_ID) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(payload.Post_IDs));
      found = true;
      break;
    }
  }
  if(!found) sheet.appendRow([payload.User_ID, JSON.stringify(payload.Post_IDs)]);
}
```

4. Click **Deploy > New Deployment**.
5. Select **Web App**.
6. Set **Execute as:** Me.
7. Set **Who has access:** Anyone.
8. Copy the **Web App URL** provided after deployment.

### 3. Configure the Web App
1. Open `constants.tsx` in your project.
2. Paste the URL into `GSHEET_API_URL`.

---

## 🛠 Features
- **Remote Database**: Seamless CRUD with Google Sheets.
- **Role-Based Access**: Admin and Normal user views.
- **Validation**: Strict input verification for mobile, account numbers, and dropdowns.
- **Offline Resiliency**: Uses LocalStorage cache if the connection drops.
