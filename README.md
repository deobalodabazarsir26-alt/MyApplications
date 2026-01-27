
# Employee Management System (EMS)

A high-performance, responsive web application built with React, Bootstrap 5, and Vite, using Google Sheets as a remote database.

## 🚀 Google Sheets Integration Setup

To use your Google Sheet as a database, follow these steps exactly:

### 1. Prepare your Google Sheet
Ensure your Google Sheet has the following tab names and headers (case sensitive):
- `User`: (User_ID, User_Name, Password, User_Type, T_STMP_ADD, T_STMP_UPD)
- `Department`: (Department_ID, Department_Name, Department_Type, T_STMP_ADD, T_STMP_UPD)
- `Office`: (Office_ID, Office_Name, Block, AC_No, Department_ID, User_ID, T_STMP_ADD, T_STMP_UPD)
- `Bank`: (Bank_ID, Bank_Name, T_STMP_ADD, T_STMP_UPD)
- `Bank_Branch`: (Branch_ID, Branch_Name, IFSC_Code, Bank_ID, T_STMP_ADD, T_STMP_UPD)
- `Post`: (Post_ID, Post_Name, Category, Class, T_STMP_ADD, T_STMP_UPD)
- `Payscale`: (Pay_ID, Pay_Name, T_STMP_ADD, T_STMP_UPD)
- `Employee`: (Employee_ID, Employee_Name, Employee_Surname, Gender, DOB, PwD, Service_Type, Post_ID, Pay_ID, Department_ID, Office_ID, Mobile, EPIC, Bank_ID, Branch_ID, ACC_No, IFSC_Code, Active, DA_Reason, T_STMP_ADD, T_STMP_UPD)
- `UserPostSelections`: (User_ID, Post_ID)

### 2. Add Automatic IFSC Lookup Function
You can get the branch name automatically in your Google Sheet by adding this custom script.
1. Open your sheet, go to **Extensions > Apps Script**.
2. Add this function to your code:

```javascript
/**
 * Fetches the Branch Name from the web based on IFSC code.
 * Usage: =FETCH_IFSC_BRANCH("SBIN0001234")
 * @customfunction
 */
function FETCH_IFSC_BRANCH(ifsc) {
  if (!ifsc) return "";
  try {
    var url = "https://ifsc.razorpay.com/" + ifsc;
    var response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
    if (response.getResponseCode() == 200) {
      var data = JSON.parse(response.getContentText());
      return data.BRANCH;
    }
    return "Not Found";
  } catch (e) {
    return "Error: " + e.toString();
  }
}

/**
 * Fetches the Bank Name from the web based on IFSC code.
 * Usage: =FETCH_IFSC_BANK("SBIN0001234")
 * @customfunction
 */
function FETCH_IFSC_BANK(ifsc) {
  if (!ifsc) return "";
  try {
    var url = "https://ifsc.razorpay.com/" + ifsc;
    var response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
    if (response.getResponseCode() == 200) {
      var data = JSON.parse(response.getContentText());
      return data.BANK;
    }
    return "Not Found";
  } catch (e) {
    return "Error";
  }
}
```

### 3. Deploy the Google Apps Script
... [Existing deployment instructions from original README] ...
