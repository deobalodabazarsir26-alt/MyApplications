
# Employee Management System (EMS)

A high-performance, responsive web application built with React, Bootstrap 5, and Vite, using Google Sheets as a remote database.

## 🚀 Google Sheets Integration Setup

To use your Google Sheet as a database, follow these steps exactly:

### 1. Prepare your Google Sheet
Ensure your Google Sheet (ID: `1ESYHbrrjiTOFY49P9KXzOoGEJQPSGgWOE6JA-vNIFdU`) has the following tab names and headers:
- `User`: (User_ID, User_Name, Password, User_Type)
- `Department`: (Department_ID, Department_Name, **Department_Type**)
- `Office`: (Office_ID, Office_Name, Block, AC_No, Department_ID, User_ID)
- `Bank`: (Bank_ID, Bank_Name)
- `Bank_Branch`: (Branch_ID, Branch_Name, IFSC_Code, Bank_ID)
- `Post`: (Post_ID, Post_Name, Category, Class)
- `Payscale`: (Pay_ID, Pay_Name)
- `Employee`: (Employee_ID, Employee_Name, Employee_Surname, Gender, DOB, PwD, Service_Type, Post_ID, Pay_ID, Department_ID, Office_ID, Mobile, EPIC, Bank_ID, Branch_ID, ACC_No, IFSC_Code, Active, DA_Reason, T_STMP_ADD, T_STMP_UPD)
- `UserPostSelections`: (User_ID, Post_ID)

### 2. Deploy the Google Apps Script
1. Open your Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Replace the entire code with the following snippet:

```javascript
/**
 * GOOGLE APPS SCRIPT FOR EMS SYSTEM (V3 - Enhanced Relational Mapping)
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

  const upsSheet = SS.getSheetByName('UserPostSelections');
  const selections = {};
  if (upsSheet) {
    const rows = upsSheet.getDataRange().getValues();
    rows.shift();
    rows.forEach(row => {
      const uId = row[0];
      const pId = row[1];
      if (uId) {
        if (!selections[uId]) selections[uId] = [];
        if (pId) selections[uId].push(Number(pId));
      }
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
    case 'deleteOffice': deleteRow('Office', 'Office_ID', payload.Office_ID); break;
    case 'upsertDepartment': upsertRow('Department', 'Department_ID', payload); break;
    case 'deleteDepartment': deleteRow('Department', 'Department_ID', payload.Department_ID); break;
    case 'upsertBank': upsertRow('Bank', 'Bank_ID', payload); break;
    case 'deleteBank': deleteRow('Bank', 'Bank_ID', payload.Bank_ID); break;
    case 'upsertBranch': upsertRow('Bank_Branch', 'Branch_ID', payload); break;
    case 'deleteBranch': deleteRow('Bank_Branch', 'Branch_ID', payload.Branch_ID); break;
    case 'upsertPost': upsertRow('Post', 'Post_ID', payload); break;
    case 'deletePost': deleteRow('Post', 'Post_ID', payload.Post_ID); break;
    case 'upsertPayscale': upsertRow('Payscale', 'Pay_ID', payload); break;
    case 'deletePayscale': deleteRow('Payscale', 'Pay_ID', payload.Pay_ID); break;
    case 'upsertUser': upsertRow('User', 'User_ID', payload); break;
    case 'deleteUser': deleteRow('User', 'User_ID', payload.User_ID); break;
    case 'updatePostSelections': updatePostSelections(payload); break;
  }

  return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function upsertRow(sheetName, idColumnName, data) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return;
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
  if (!sheet) return;
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
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  const uId = payload.User_ID;
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] == uId) {
      sheet.deleteRow(i + 1);
    }
  }
  if (payload.Post_IDs && Array.isArray(payload.Post_IDs)) {
    payload.Post_IDs.forEach(pId => {
      sheet.appendRow([uId, pId]);
    });
  }
}
```

4. Click **Deploy > New Deployment**.
5. Select **Web App**.
6. Set **Execute as:** Me.
7. Set **Who has access:** Anyone.
8. Copy the **Web App URL** and update your `constants.tsx`.

---
